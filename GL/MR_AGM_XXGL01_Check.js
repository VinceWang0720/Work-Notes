    /**
     * @NApiVersion 2.1
     * @NModuleScope SameAccount
     * @NScriptType MapReduceScript
     */
    define(['N/log', 'N/search', 'N/record', 'N/email', 'N/runtime', 'N/format', 'N/xml', 'N/https',
            'SuiteScripts/XXGL01/MR_AGM_XXGL01_Library.js',
            'SuiteScripts/AGM_CommonAPI/CS_AGM_INBOUND_ACK_lib'],
        (log, search, record, email, runtime, format, xml, https,
        library,
        CS_AGM_INBOUND_ACK_lib) => {

            class ErrorMessage {
                constructor(error) {
                    this.message = error
                }
            }

            function doGetInputData(context) {
                try {
                    log.debug("---doGetInputData---");
                    return getInputData(context)
                } catch (e) {
                    log.error('error in getInputData', e)
                }
            }

            function getInputData(context) {
                log.debug('start', 'start')
                return search.load({
                    id: 'customsearch_xxgl01_header_check'
                })
            }

            function doMap(context) {
                try {
                    log.debug("---doMap---");
                    return map(context);
                } catch (e) {
                    log.error('error in map', e);
                }
            }

            function map(context) {
                
            }
    
            function doReduce(context) {
                try {
                    log.debug("---doReduce---");
                    return reduce(context);
                } catch (e) {
                    log.error('error in reduce', e);
                }
            }

            function reduce(context) {
                log.debug('context.key', context.key)
                log.debug('context.values', context.values)
                let values = context.values;
                log.debug('values.length', values.length)
                values.map(checkProcess)
            }

            function doSummarize(summary) {
                try {
                    log.debug("---doSummarize---");
                    return summarize(summary)
                } catch (e) {
                    log.error('error in summary', e)
                }
            }

            function summarize(summary) {

            }

            function checkProcess(context) {
                log.debug("---checkProcess---");
                // let tempHeader = JSON.parse(context.value);
                let tempHeader = JSON.parse(context);
                log.debug('tempHeader', tempHeader);
                let ediXmlTemp = tempHeader['values']['custrecord_gl01_transaction_id']['value']
                //let currentDataNum = tempHeader['values']['custrecord_gl01_current_datanum']
                //log.debug('currentDataNum', currentDataNum);
                let tempHeaderId = tempHeader.id;
                let writtenValues;
                let currentNum;
                try {
                    check(tempHeaderId);
                    log.debug("writtenValues");
                    currentNum = getDataNum(tempHeaderId);
                    log.debug("Afert check currentNum",currentNum);
                    let details = library.searchDetails(tempHeaderId).map(library.parseDetailSearchResult);
                    let detail = details[currentNum];
                    log.debug("detail.mark",detail.mark);

                    writtenValues = {
                        custrecord_gl01_status_check: 'S',
                        custrecord_gl01_message_check: ''
                    }

                    //  if(detail.mark === "the last"){
                    //  writtenValues = {
                    //          custrecord_gl01_status_check: 'S',
                    //          custrecord_gl01_message_check: ''
                    //      }
                    //  }else{
                    //      writtenValues = {
                    //          custrecord_gl01_status_check: '',
                    //          custrecord_gl01_message_check: ''
                    //      }
                    //  }
                    
                } catch (e) {
                    writtenValues = {
                        custrecord_gl01_status_check: 'E',
                        custrecord_gl01_message_check: e.message
                    }
                    log.error('check failed', e)
                }

                record.submitFields({
                    type: 'customrecord_xxgl01_header_temp',
                    id: tempHeaderId,
                    values: writtenValues
                })
                if (!ediXmlTemp) {
                    return;
                }
                //writeEdiProcess(ediXmlTemp);
                writeEdiProcessV2(ediXmlTemp);
            }

            function check(tempHeaderId) {
                log.debug("---check---");
                //checkHeader(tempHeader)
                let {
                    headerId,
                    ledger,
                    category,
                    group,
                    glDate,
                    currentNum,
                } = library.getHeaderValues(tempHeaderId)
                let subsidiary = library.searchSubsidiary(ledger)
                if (subsidiary.length === 0) {
                    throw new ErrorMessage(`Company not found for ${ledger}`)
                }
                log.debug('currentNum',currentNum)

                let accountingPeriod = library.searchAccountingPeriod(glDate)
                if (accountingPeriod.length === 0) {
                    throw new ErrorMessage(`Accounting period is Closed`)
                }
                //let category = "INV_PO"; let group = "PO Receipt";
                let mappings = library.searchMappingTable(category, group)
                log.debug("mappings",mappings);
                if (mappings.length === 0) {
                    throw new ErrorMessage(`No Mapping found ${category}, ${group}`)
                }
                //checkDetail
                let details = library.searchDetails(headerId).map(library.parseDetailSearchResult); 
                let lastDetail = details[details.length - 1];

                //註記最後一筆資料
                library.setdetailMark(lastDetail.id,"the last");
                log.debug("lastDetail",lastDetail);
                log.debug("lastDetail2",details[details.length - 2]);
                log.debug("details length",details.length);

                let detail = record.load({
                    type: 'customrecord_xxgl01_detail_temp',
                    id: lastDetail.id
                });

                log.debug("After save detail", detail);

                let mark = detail.getValue({
                    fieldId: 'custrecord_gl01_d_mark'
                });

                log.debug("After save mark", mark);

                let recordIdAfterSave  = " ";

                let currentValue =  getDataNum(tempHeaderId);
                log.debug('currentValue',currentValue );

                for (let i = currentValue; i < details.length-currentValue; i++) {
                    let detail = details[i];
                    try {
                        let remaining = library.logRemainUsage("check detail:" + i);
                        if (remaining < 50) {

                            recordIdAfterSave = library.getHeaderCurrentNum(tempHeaderId,i);
                            log.debug('recordIdAfterSave',recordIdAfterSave );
                            
                            log.debug("current i", i);
                            log.debug("The end");
                            return;
                            //throw new ErrorMessage(`Script Execution Usage Limit Exceeded`)
                        }
                        checkDetail(category, group, detail, subsidiary[0],i);
                    } catch (e) {
                        e.message = `Detail Id: ${detail.id}|${e.message}`
                        throw e;
                    }
                }
            }

            function checkDetail(category, group, detail, subsidiary_id,i) {
                log.debug("---checkDetail---",i);
                //let remaining = library.logRemainUsage("check detail:" + i);
                //log.debug("checkDetail Remaining",remaining);
                log.debug("category",category);
                if (category === "INV_SO") {
                    log.debug("INV_SO");
                    let customers = library.searchCustomer(detail.partyNumber, detail.partySiteNumber)
                    let remaining = library.logRemainUsage("check detail:" + i);
                    log.debug("INV_SO Remaining",remaining);
                    if (customers.length === 0) {
                        throw new ErrorMessage(`Customer Not found for party number ${detail.partyNumber}, partySiteNumber ${detail.partySiteNumber}`)
                    }
                }

                if (category === "INV_PO") {
                    log.debug("INV_PO");

                    //let remaining = library.logRemainUsage("check detail:" + i);
                    //log.debug("INV_PO Remaining",remaining);
                    // let vendors = library.searchVendor(detail.partyNumber)
                    let vendors = library.searchVendor(detail.partyNumber, detail.partySiteNumber)
                    if (vendors.length === 0) {
                        // throw new ErrorMessage(`Vendor Not found for party number ${detail.partyNumber}`)
                        throw new ErrorMessage(`Vendor Not found for party number ${detail.partyNumber}, partySiteNumber ${detail.partySiteNumber}`)
                    }
                }

                if (detail.salesRepNumber !== "") {
                    log.debug("detail.salesRepNumber",detail.salesRepNumber);
                    let employee = library.searchEmployee(detail.salesRepNumber)
                    if (employee.length === 0) {
                        //log.debug("if employee.length === 0");
                        throw new ErrorMessage(`Employee Not found for salesRepNumber ${detail.salesRepNumber}`)
                    }

                    if (category === "INV_SO") {
                        if (!employee.map(library.parseEmployee)[0].salesRep) {
                            throw new ErrorMessage(`Sales Rep should be True`)
                        }
                    }
                }

                log.debug('detail.reconciliationRef', detail.reconciliationRef)
                if(detail.reconciliationRef) {
                if(!library.checkCustomSegmentReconciliation(detail.reconciliationRef))  {
                    library.insertCustomSegmentReconciliation(detail.reconciliationRef)
                }
                }

                // check costCenter
                // currently if costCenter is empty, not check the department
                //log.debug('detail.costCenter', detail.costCenter)
                if (detail.costCenter) {
                    let departments = library.searchDepartment(detail.costCenter)
                    if (departments.length === 0) {
                        throw new ErrorMessage(`Department Not found for cost center ${detail.costCenter}`)
                    }
                }

                //log.debug('detail.productLine', detail.productLine)
                if (detail.productLine !== '0000') {
                    if (!library.checkCustomSegment(detail.productLine)) {
                        throw new ErrorMessage(`Custom Segment Not found ${detail.productLine}`)
                    }
                }

                let locations = library.searchLocation_v2(detail.warehouseBank,subsidiary_id)
                log.debug('1128 check location v2 row','function searchLocation_v2 :' + locations.length)
                if (locations.length === 0) {
                    throw new ErrorMessage(`Location Not found for ${detail.warehouseBank}`)
                }

                let mapping = library.searchMappingTableTxnType(category, group, detail.trxType)
                if (mapping.length === 0) {
                    throw new Error(`Mapping Not found ${category}, ${group}, ${detail.trxType}`) // this should be detected on check stage.
                }

                if(detail.projectCode) {
                    if (!library.checkCustomSegmentInternalProject(detail.projectCode)) {
                        throw new ErrorMessage(`Internal Project Not Found ${detail.projectCode}`)
                    }
                }
            }

            function getDataNum(tempHeaderId){
                let headerTemp = record.load({
                    type: 'customrecord_xxgl01_header_temp',
                    id: tempHeaderId
                });

                let currentValue = headerTemp.getValue({
                    fieldId: 'custrecord_gl01_current_datanum'
                });
                return currentValue;
            };

            function writeEdiProcessV2(ediXmlTemp) {
                log.debug("---writeEdiProcessV2---");
                let ediHeaders = library.getEdiHeaders(ediXmlTemp);
                if (ediHeaders.length === 0) {
                    log.debug('writeEdiProcessV2', 'ediHeaders.length = 0')
                    return;
                }
                if (ediHeaders.some(header => header.checkStatus === '')) {
                    log.debug('writeEdiProcessV2', 'some headers are not checked yet')
                    return;
                }

                let writtenEdiValues;
                if (ediHeaders.some(header => header.checkStatus === 'E')) {
                    writtenEdiValues = {
                        custrecord_agm_edi_xml_temp_status_check: 'E',
                        custrecord_agm_edi_xml_temp_scheck_date: new Date()
                    }
                    soapRequest(ediXmlTemp, 'N')
                } else {
                    // ediHeaders.every(header => header.checkStatus === 'S')
                    writtenEdiValues = {
                        custrecord_agm_edi_xml_temp_status_check: 'S',
                        custrecord_agm_edi_xml_temp_scheck_date: new Date()
                    }
                    soapRequest(ediXmlTemp, 'Y')
                }
                record.submitFields({
                    type: 'customrecord_agm_edi_xml_temp',
                    id: ediXmlTemp,
                    values: writtenEdiValues
                })
            }

            function soapRequest(ediId, status) {
                log.debug("---soapRequest---");
                //ACK XML OUTBOUND
                let lookup = search.lookupFields({
                    type: 'customrecord_agm_edi_xml_temp', //AGM_EDI_XML_TEMP
                    id: ediId,
                    columns: ['name']
                })
                let statusCode;
                let description;
                let documentName = lookup.name;
                let xml_body = CS_AGM_INBOUND_ACK_lib.GetInboundACK(documentName, status);
                //log. debug (' inbound_ack'. 'inbound ack + xml body)
                // call api
                try {
                    let response = https.request({
                        method: https.Method.POST,
                        // url: 'https://dev-b2b.acer.com.tw:4443/soap/InboundDefaultSOAP',
                        url: urlSearch(),
                        body: xml_body
                    });

                    let xmlDocument = readXml(response.body);
                    statusCode = xml.XPath.select({
                        node: xmlDocument,
                        xpath: '//ns:StatusCode',
                    })[0].textContent;
                    description = xml.XPath.select({
                        node: xmlDocument,
                        xpath: '//ns:Description'
                    })[0].textContent;
                } catch (e) {
                    log.error('error in soapRequest', e)
                    statusCode = 'Error';
                    description = 'API Error';
                }

                record.submitFields({
                    type: 'customrecord_agm_edi_xml_temp', //AGM_EDI_XML_TEMP
                    id: ediId,
                    values: {
                        custrecord_agm_edi_xml_temp_scheck_code: statusCode,
                        custrecord_agm_edi_xml_temp_scheck_desc: description
                    }
                })

                function readXml(xmlContent) {
                    return xml.Parser.fromString({
                        text: xmlContent
                    });
                }
            }

            function urlSearch() {
                log.debug("---urlSearch---");
                let ackUrl = '';
                let cus_ooutbound_setobj = search.create({
                    type: "customrecord_agm_edi_xml_outbound_set",
                    filters: [['custrecord_agm_edi_xml_obset_operationpg', 'is', 'ACK']],
                    columns: [search.createColumn({name: "custrecord_agm_edi_xml_obset_url", label: "OUTBOUND_URL"})
                    ]
                });
                cus_ooutbound_setobj.run().each(function(result){
                    ackUrl = result.getValue({name: 'custrecord_agm_edi_xml_obset_url'})
                });
                return ackUrl;
            }

            function writeEdiProcess(ediXmlTemp) {
                log.debug("---writeEdiProcess---");
                let writtenEdiValues;
                if (library.sameEdiHeadersAllCheckSuccess(ediXmlTemp)) {
                    writtenEdiValues = {
                        custrecord_agm_edi_xml_temp_status_check: 'S',
                        custrecord_agm_edi_xml_temp_scheck_date: new Date()
                    }
                } else {
                    writtenEdiValues = {
                        custrecord_agm_edi_xml_temp_status_check: 'E',
                        custrecord_agm_edi_xml_temp_scheck_date: new Date()
                    }
                }
                record.submitFields({
                    type: 'customrecord_agm_edi_xml_temp',
                    id: ediXmlTemp,
                    values: writtenEdiValues
                })
            }

            return {
                getInputData: doGetInputData,
                // map: doMap,
                reduce: doReduce,
                summarize: doSummarize,
                check: check,
            };
        });
