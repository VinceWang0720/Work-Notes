    define(['N/log', 'N/search', 'N/record', 'N/email', 'N/runtime', 'N/format'],
        (log, search, record, email, runtime, format) => {

            class ErrorMessage {
                constructor(error) {
                    this.message = error
                }
            }

            function searchSubsidiary(name) {
                let subsidiarySearchObj = search.create({
                    type: "subsidiary",
                    filters:
                        [
                            ["isinactive", "is", "F"],
                            "AND",
                            ["custrecord_gmc_ledger", "is", name]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "name",
                                sort: search.Sort.ASC
                            }),
                            "city",
                            "state",
                            "country",
                            "currency"
                        ]
                });
                let searchResultCount = subsidiarySearchObj.runPaged().count;
                //log.debug("subsidiarySearchObj result count", searchResultCount);
                let companies = [];
                subsidiarySearchObj.run().each(function (result) {
                    companies.push(result.id)
                    return true;
                });
                return companies;
            }

            function searchAccountingPeriod(glDate) {
                //let glDate = "2021/12/30";
                //log.debug('glDate', glDate)
                let accountingperiodSearchObj = search.create({
                    type: "accountingperiod",
                    filters:
                        [
                            ["startdate", "onorbefore", glDate],
                            "AND",
                            ["enddate", "onorafter", glDate],
                            "AND",
                            ["closed", "is", "F"]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "periodname",
                                sort: search.Sort.ASC
                            }),
                            "startdate",
                            "enddate",
                            "closed"
                        ]
                });
                let searchResultCount = accountingperiodSearchObj.runPaged().count;
                //log.debug("accountingperiodSearchObj result count", searchResultCount);
                let periods = []
                accountingperiodSearchObj.run().each(function (result) {
                    periods.push(result)
                    return true;
                });
                return periods;
            }

            function searchMappingTable(category, group) {
                let customrecord_xxgl01_mapping_tempSearchObj = search.create({
                    type: "customrecord_xxgl01_mapping_temp",
                    filters:
                        [
                            ["isinactive", "is", "F"],
                            "AND",
                            [`formulanumeric: CASE WHEN LOWER({custrecord_gl01_m_txn_category})='${category.toLowerCase()}' THEN 1 ELSE 0 END`, "equalto", "1"],
                            //["custrecord_gl01_m_txn_category", "is", category],
                            "AND",
                            [`formulanumeric: CASE WHEN LOWER({custrecord_gl01_m_txn_group})='${group.toLowerCase()}' THEN 1 ELSE 0 END`, "equalto", "1"]
                            //["custrecord_gl01_m_txn_group", "is", group]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "scriptid",
                                sort: search.Sort.ASC
                            }),
                            "custrecord_gl01_m_mark",
                            "custrecord_gl01_m_ledger",
                            "custrecord_gl01_m_txn_category",
                            "custrecord_gl01_m_txn_category_desc",
                            "custrecord_gl01_m_txn_group",
                            "custrecord_gl01_m_txn_group_desc",
                            "custrecord_gl01_m_txn_type",
                            "custrecord_gl01_m_txn_type_desc",
                            "custrecord_gl01_m_dr_cr",
                            "custrecord_gl01_m_company",
                            "custrecord_gl01_m_major",
                            "custrecord_gl01_m_minor",
                            "custrecord_gl01_m_local",
                            "custrecord_gl01_m_inter_com",
                            "custrecord_gl01_m_product_line",
                            "custrecord_gl01_m_costcenter",
                            "custrecord_gl01_m_market",
                            "custrecord_gl01_m_future",
                            "custrecord_gl01_m_reconcil_ref",
                            "custrecord_gl01_m_line_desc",
                            "custrecord_gl01_m_transaction_id",
                            "custrecord_gl01_m_status_check",
                            "custrecord_gl01_m_message_check",
                            "custrecord_gl01_m_status_insert",
                            "custrecord_gl01_m_message_insert"
                        ]
                });
                let searchResultCount = customrecord_xxgl01_mapping_tempSearchObj.runPaged().count;
                let mappings = []
                ////log.debug("customrecord_xxgl01_mapping_tempSearchObj result count", searchResultCount);
                customrecord_xxgl01_mapping_tempSearchObj.run().each(function (result) {
                    mappings.push(result)
                    return true;
                });
                return mappings;
            }

            function searchDetails(headerId) {
                let customrecord_xxgl01_detail_tempSearchObj = search.create({
                    type: "customrecord_xxgl01_detail_temp",
                    filters:
                        [
                            ["isinactive", "is", "F"],
                            "AND",
                            ["custrecord_xxgl01_hid", "anyof", headerId]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "scriptid",
                                sort: search.Sort.ASC
                            }),
                            "custrecord_gl01_d_mark",
                            "custrecord_gl01_d_trx_type",
                            "custrecord_gl01_d_trx_num",
                            "custrecord_gl01_d_trx_party_num",
                            "custrecord_gl01_d_trx_party_site_num",
                            "custrecord_gl01_d_salesrep_num",
                            "custrecord_gl01_d_conversion_date",
                            "custrecord_gl01_d_conversion_rate",
                            "custrecord_gl01_d_department",
                            "custrecord_gl01_d_costcenter",
                            "custrecord_gl01_d_item",
                            "custrecord_gl01_d_trx_qty",
                            "custrecord_gl01_d_unit_price",
                            "custrecord_gl01_d_unit_cost",
                            "custrecord_gl01_d_amount",
                            "custrecord_gl01_d_product_line",
                            "custrecord_gl01_d_project_code",
                            "custrecord_gl01_d_fund_code",
                            "custrecord_gl01_d_warehouse_bank",
                            "custrecord_gl01_d_reconcil_ref",
                            "custrecord_gl01_d_dr_cr",
                            "custrecord_xxgl01_hid",
                            "custrecord_gl01_d_status_check",
                            "custrecord_gl01_d_message_check",
                            "custrecord_gl01_d_status_insert",
                            "custrecord_gl01_d_message_insert",
                            "custrecord_gl01_d_category_name_s",
                            "custrecord_gl01_d_gl01_document_num_s"
                        ]
                });
                let searchResultCount = customrecord_xxgl01_detail_tempSearchObj.runPaged().count;
                let details = []
                ////log.debug("customrecord_xxgl01_detail_tempSearchObj result count", searchResultCount);
                customrecord_xxgl01_detail_tempSearchObj.run().each(function (result) {
                    details.push(result);
                    return true;
                });
                return details
            }

            function searchCustomer(gGlobalHqNumber, gSiteNumber) {
                let customerSearchObj = search.create({
                    type: "customer",
                    filters:
                        [
                            ["isinactive", "is", "F"],
                            "AND",
                            ["custentity_gmc_billing_no", "is", gGlobalHqNumber],
                            "AND",
                            ["custentity_gmc_billing_site_no", "is", gSiteNumber]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "entityid",
                                sort: search.Sort.ASC
                            }),
                            "altname",
                            "email",
                            "phone",
                            "altphone",
                            "fax",
                            "contact",
                            "altemail",
                            "custentity_availablecredit",
                            "custentity_creditlimit",
                            "custentity_gmc_inter_code"
                        ]
                });
                let searchResultCount = customerSearchObj.runPaged().count;
                ////log.debug("customerSearchObj result count", searchResultCount);
                let customers = []
                customerSearchObj.run().each(function (result) {
                    customers.push(result)
                    return true;
                });
                return customers;
            }

            function logRemainUsage(tag) {
                let remainingUsage = runtime.getCurrentScript().getRemainingUsage();
                //log.debug('Remaining Usage, after ' + tag, remainingUsage);
                return remainingUsage;
            }

            function searchVendor(partyNumber, siteNumber) {
                let vendorSearchObj = search.create({
                    type: "vendor",
                    filters:
                        [
                            ["isinactive", "is", "F"],
                            "AND",
                            ["custentity_gmc_billing_no", "is", partyNumber],
                            "AND",
                            ["custentity_gmc_billing_site_no", "is", siteNumber]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "entityid",
                                sort: search.Sort.ASC
                            }),
                            "altname",
                            "email",
                            "phone",
                            "altphone",
                            "fax",
                            "altemail",
                            "custentityast_bank_charge_bearer"
                        ]
                });
                let searchResultCount = vendorSearchObj.runPaged().count;
                let vendors = []
                ////log.debug("vendorSearchObj result count", searchResultCount);
                vendorSearchObj.run().each(function (result) {
                    vendors.push(result)
                    return true;
                });
                return vendors
            }
            
            function parseVendor(result) {
                return {id: result.id}
            }

            function parseMapping(result) {
                let id = result.id;
                let major = result.getValue({name: 'custrecord_gl01_m_major'});
                let minor = result.getValue({name: 'custrecord_gl01_m_minor'});
                let local = result.getValue({name: 'custrecord_gl01_m_local'});
                let interCom = result.getValue({name: 'custrecord_gl01_m_inter_com'});
                let drCr = result.getValue({name: 'custrecord_gl01_m_dr_cr'});
                let productLine = result.getValue({name: 'custrecord_gl01_m_product_line'});
                let costCenter = result.getValue({name: 'custrecord_gl01_m_costcenter'});
                let market = result.getValue({name: 'custrecord_gl01_m_market'});

                return {id, major, minor, local, interCom, drCr, productLine, costCenter, market}
            }

            function parseLocation(result) {
                let id = result.id
                let whCode = result.getValue({name: "custrecord_gmc_wh_code"})
                let costCenter = result.getValue({name: "custrecord_gmc_wh_cost_center"})
                let whAccount = result.getValue({name: "custrecord_gmc_wh_acctount"})
                let whAccountNumber = result.getValue({name: "custrecord_gmc_wh_acctount_s"})
                let gProductLine = result.getValue({name: "cseg_gm_c_product_l"})
                let gMarketCode = result.getValue({name: "cseg_gm_c_market"})
                return {
                    id, whCode, costCenter, whAccount, whAccountNumber, gProductLine, gMarketCode
                }
            }

            function searchAccount(number) {
                let accountSearchObj = search.create({
                    type: "account",
                    filters:
                        [
                            ["isinactive", "is", "F"],
                            "AND",
                            ["number", "is", number]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "name",
                                sort: search.Sort.ASC
                            }),
                            "displayname",
                            "type",
                            "description",
                            "balance",
                            "custrecord_fam_account_showinfixedasset"
                        ]
                });
                let searchResultCount = accountSearchObj.runPaged().count;
                ////log.debug("accountSearchObj result count", searchResultCount);
                let accounts = []
                accountSearchObj.run().each(function (result) {
                    accounts.push(result)
                    return true;
                });
                return accounts;
            }

            function parseDetailSearchResult(result) {
                let DEBIT = '1';
                let CREDIT = '2';
                let id = result.id;
                let partyNumber = result.getValue({name: 'custrecord_gl01_d_trx_party_num'});
                let partySiteNumber = result.getValue({name: 'custrecord_gl01_d_trx_party_site_num'});
                let salesRepNumber = result.getValue({name: 'custrecord_gl01_d_salesrep_num'});
                let costCenter = result.getValue({name: 'custrecord_gl01_d_costcenter'});
                let productLine = result.getValue({name: 'custrecord_gl01_d_product_line'});
                let warehouseBank = result.getValue({name: 'custrecord_gl01_d_warehouse_bank'});
                let trxType = result.getValue({name: 'custrecord_gl01_d_trx_type'});
                let projectCode = result.getValue({name: 'custrecord_gl01_d_project_code'});
                let reconciliationRef = result.getValue({name: 'custrecord_gl01_d_reconcil_ref'});
                let drCr = result.getValue({name: 'custrecord_gl01_d_dr_cr'});
                let lineType = drCr === DEBIT ? 'debit' : drCr === CREDIT ? 'credit' : '';
                let trxQty = result.getValue({name: 'custrecord_gl01_d_trx_qty'});
                let unitPrice = result.getValue({name: 'custrecord_gl01_d_unit_price'});
                let categorySourced = result.getValue({name: 'custrecord_gl01_d_category_name_s'});
                let documentNumberSourced = result.getValue({name: 'custrecord_gl01_d_gl01_document_num_s'});
                let trxNum = result.getValue({name: 'custrecord_gl01_d_trx_num'});
                let item = result.getValue({name: 'custrecord_gl01_d_item'});
                let unitCost = result.getValue({name: 'custrecord_gl01_d_unit_cost'});
                let amount = result.getValue({name: 'custrecord_gl01_d_amount'});
                let mark = result.getValue({name: 'custrecord_gl01_m_mark'});
                let memo = `${partyNumber}|${documentNumberSourced}|${item}|${trxQty}|${unitPrice}|${unitCost}`;
                let customers, vendors;
                let locations;
                let mappingTable
                function setupSpecial(mappings,sid) {
                    if (mappings.length === 0) {
                        log.error('getAccount 0', 'mappings should not be empty')
                        return;
                    }
                    ////log.debug('1128 setupSpecial sid', sid)
                    locations = searchLocation(warehouseBank,sid).map(parseLocation)
                    ////log.debug('locations length', locations.length)
                    customers = searchCustomer(partyNumber, partySiteNumber).map(parseCustomer)
                    ////log.debug('customers length', customers.length)
                    let mappingObjects = mappings.map(parseMapping);
                    ////log.debug('mappingObjects', mappingObjects)
                    // mappingTable = mappingObjects.find(object => object.drCr === drCr);
                    // mappingObjects = [
                    //     { id: "128", major: "WAREHOUSE", minor: "WAREHOUSE", local: "WAREHOUSE", interCom: "WAREHOUSE", drCr: "1", productLine: "WAREHOUSE", costCenter: "WAREHOUSE", market: "WAREHOUSE" },
                    //     { id: "129", major: "4508", minor: "00", local: "000", interCom: "000", drCr: "2", productLine: "S.PRODUCT_LINE", costCenter: "S.COSTCENTER", market: "000" }
                    // ]

                    return mappingObjects.map(mappingTable=>{
                        let locationFirst;
                        if (locations.length > 0) {
                            locationFirst = locations[0].id
                        }
                        ////log.debug('locations', locationFirst)
                        let account = getAccount(mappingTable)
                        ////log.debug('account', account)
                        let gProductLine = getGProductLine(mappingTable);
                        ////log.debug('gProductLine', gProductLine)
                        let gCostCenter = getGCostCenter(mappingTable)
                        ////log.debug('gCostCenter', gCostCenter)
                        let market = getMarket(mappingTable);
                        ////log.debug('market', market)
                        let customer = getCustomer();
                        ////log.debug('amount calculate', {trxQty, unitCost})
                        let newAmount = amount ? amount: Number((trxQty * unitCost).toFixed(2))
                        let reconciliationRefInsert = searchOrCreate(reconciliationRef);
                        return {
                            id,
                            account,
                            productLine: gProductLine,
                            costCenter: gCostCenter,
                            market,
                            amount: newAmount,
                            lineType: mappingTable.drCr === DEBIT ? 'debit' : mappingTable.drCr === CREDIT ? 'credit' : '',
                            categorySourced,
                            customer,
                            salesRepNumber,
                            trxType,
                            trxNum,
                            item,
                            trxQty,
                            unitPrice,
                            unitCost,
                            location: locationFirst,
                            reconciliationRefInsert,
                            memo,
                        }
                    })
                }
                
                function setup(mappings,sid) {
                    if (mappings.length === 0) {
                        log.error('getAccount 0', 'mappings should not be empty')
                        return;
                    }
                    ////log.debug('1128 setup sid',sid)
                    locations = searchLocation(warehouseBank,sid).map(parseLocation)
                    ////log.debug('locations length', locations.length)
                    customers = searchCustomer(partyNumber, partySiteNumber).map(parseCustomer)
                    ////log.debug('customers length', customers.length)
                    let mappingObjects = mappings.map(parseMapping);
                    ////log.debug('mappingObjects', mappingObjects)
                    mappingTable = mappingObjects.find(object => object.drCr === drCr);
                    //////log.debug('mappingTable.id', mappingTable.id)

                    let locationFirst;
                    if (locations.length > 0) {
                        locationFirst = locations[0].id
                    }
                    //log.debug('1128 locations',locationFirst)
                    let account = getAccount(mappingTable)
                    //log.debug('account', account)
                    let gProductLine = getGProductLine(mappingTable);
                    //log.debug('gProductLine', gProductLine)
                    let gCostCenter = getGCostCenter(mappingTable)
                    //log.debug('gCostCenter', gCostCenter)
                    let market = getMarket(mappingTable);
                    //log.debug('market', market)
                    let customer = getCustomer();
                    //log.debug('amount calculate', {trxQty, unitCost})
                    let newAmount = amount ? amount: Number((trxQty * unitCost).toFixed(2))
                    let reconciliationRefInsert = searchOrCreate(reconciliationRef);
                    return {
                        id,
                        account,
                        productLine: gProductLine,
                        costCenter: gCostCenter,
                        market,
                        amount: newAmount,
                        lineType,
                        categorySourced,
                        customer,
                        salesRepNumber,
                        trxType,
                        trxNum,
                        item,
                        trxQty,
                        unitPrice,
                        unitCost,
                        location: locationFirst,
                        reconciliationRefInsert,
                        memo,
                    }
                }

                function getAccount(mappingTable) {
                    let accountNumber = ['major', 'minor', 'local', 'interCom'].map((ele, index, arr) => {
                        if (mappingTable[ele] === "WAREHOUSE") {
                            let whAccountNumbers = locations[0].whAccountNumber.split('-')
                            if (whAccountNumbers.length === 0) {
                                throw `Account number error, couldn't get account number from: ${locations[0].whAccountNumber}`
                            }
                            return whAccountNumbers[index]
                        } else if (mappingTable[ele] === "CUSTOMER" && ele === "interCom") {
                            //log.debug('customers for interCom', customers)
                            if (customers.length === 0) {
                                throw new ErrorMessage(`Customer Not found for ${partyNumber}, ${partySiteNumber}`)
                            }
                            return customers[0].interCode
                        } else {
                            return mappingTable[ele]
                        }
                    }).join('-')

                    let foundAccounts = searchAccount(accountNumber);
                    if (foundAccounts.length === 0) {
                        log.error('getAccount 2', `foundAccounts should not be empty ${accountNumber}`)
                        throw new ErrorMessage(`foundAccounts should not be empty ${accountNumber}`)
                        return;
                    }
                    return foundAccounts[0].id;
                }


                function getGProductLine(mappingTable) {
                    if (false && mappingTable.productLine === "WAREHOUSE") {
                        return locations[0].gProductLine
                    } else {
                        let id = searchProductLine(productLine);
                        if (id === -1) {
                            let newProductLine = record.create({
                                type: 'customrecord_cseg_gm_c_product_l',
                            });
                            newProductLine.setValue({fieldId: 'name', value: productLine})
                            id = newProductLine.save()
                        }
                        return id;
                    }
                }

                function getGCostCenter(mappingTable) {
                    let departments = searchDepartment(costCenter);
                    if (departments.length === 0) {
                        return '';
                    }
                    return departments[0].id;
                    // if (["INV_TRX", "INV_PO"].indexOf(categorySourced) !== -1) {
                    //     return getDepartment()
                    // } else if (mappingTable.costCenter === "WAREHOUSE") {
                    //     return getDepartment()
                    // } else if (mappingTable.costCenter === "SALESREP") {
                    //     let employees = searchEmployee(salesRepNumber).map(parseEmployee)
                    //     //log.debug('employees getGCostCenter', employees)
                    //     return employees[0].department
                    // }
                    // return mappingTable.costCenter
                }

                function getMarket(mappingTable) {
                    if (["INV_TRX", "INV_PO"].indexOf(categorySourced) !== -1) {
                        return mappingTable.market
                    } else if (mappingTable.market === "WAREHOUSE") {
                        return locations[0].gMarketCode
                    }
                    return mappingTable.market
                }

                function getCustomer() { // this could be vendor or customer, based on the category
                    if ("INV_SO" === categorySourced) {
                        //log.debug('getCustomer', {categorySourced, customers})
                        return customers[0].id;
                    }
                    if ("INV_PO" === categorySourced) {
                        vendors = searchVendor(partyNumber, partySiteNumber)
                        //log.debug('getCustomer', {categorySourced, vendors, partyNumber, partySiteNumber})
                        return vendors[0].id
                    }
                    return ''
                }

                function getDepartment() {
                    let departments = searchDepartment(locations[0].costCenter)
                    return departments[0].id
                }
                
                function searchOrCreate(reconciliationRef) {
                    if (!reconciliationRef) {
                        return ''
                    }
                    let reconciliationRefSearchObj = search.create({
                        type: "customrecord_csegprepayment",
                        filters:
                            [
                                ["name", "is", reconciliationRef]
                            ],
                        columns:
                            [
                                search.createColumn({
                                    name: "name",
                                    sort: search.Sort.ASC
                                }),
                            ]
                    });
                    let arr = []
                    reconciliationRefSearchObj.run().each(function (result) {
                        arr.push(result)
                        return true;
                    });

                    if (arr.length === 0) {
                        return createReconciliationRef(reconciliationRef);
                    }
                    return arr[0].id

                    function createReconciliationRef(reconciliationRef) {
                        let temp = record.create({
                            type: 'customrecord_csegprepayment'
                        });
                        temp.setValue({fieldId:'name', value: reconciliationRef})
                        return temp.save();
                    }
                }

                return {
                    id,
                    partyNumber,
                    partySiteNumber,
                    salesRepNumber,
                    costCenter,
                    productLine,
                    warehouseBank,
                    trxType,
                    projectCode,
                    reconciliationRef,
                    drCr,
                    categorySourced,
                    trxNum,
                    item,
                    trxQty,
                    unitPrice,
                    unitCost,
                    amount,
                    mark,
                    setup,
                    setupSpecial,
                }
            }

            function parseCustomer(result) {
                let id = result.id
                let interCode = result.getValue({name: 'custentity_gmc_inter_code'})
                return {id, interCode}
            }

            let productLineLookup = {}
            function searchProductLine(productLineName) {
                if (productLineLookup.hasOwnProperty(productLineName)) {
                    return productLineLookup[productLineName];
                }
                let customrecord_cseg_gm_c_product_lSearchObj = search.create({
                    type: "customrecord_cseg_gm_c_product_l",
                    filters:
                        [
                            ["name", "is", productLineName]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "name",
                                sort: search.Sort.ASC
                            }),
                            "scriptid"
                        ]
                });
                let searchResultCount = customrecord_cseg_gm_c_product_lSearchObj.runPaged().count;
                //log.debug("customrecord_cseg_gm_c_product_lSearchObj result count", searchResultCount);
                let productLines = []
                customrecord_cseg_gm_c_product_lSearchObj.run().each(function (result) {
                    productLines.push(result.id)
                    return true;
                });


                let result;
                result = productLines.length === 0 ? '' : productLines[0];
                productLineLookup[productLineName] = result;
                return result;
            }

            function searchEmployee(salesRepNumber) {
                let employeeSearchObj = search.create({
                    type: "employee",
                    filters:
                        [
                            ["isinactive", "is", "F"],
                            "AND",
                            ["entityid", "is", salesRepNumber]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "entityid",
                                sort: search.Sort.ASC
                            }),
                            "altname",
                            "email",
                            "phone",
                            "altphone",
                            "fax",
                            "supervisor",
                            "title",
                            "altemail",
                            "issalesrep",
                            "department"
                        ]
                });
                let searchResultCount = employeeSearchObj.runPaged().count;
                //log.debug("employeeSearchObj result count", searchResultCount);
                let employee = []
                employeeSearchObj.run().each(function (result) {
                    employee.push(result)
                    return true;
                });
                return employee;
            }

            function parseEmployee(result) {
                let salesRep = result.getValue({name: 'issalesrep'})
                let department = result.getValue({name: 'department'})
                return {salesRep, department}
            }

            let departmentLookup = {}
            function searchDepartment(costCenter) {
                if (departmentLookup.hasOwnProperty(costCenter)) {
                    return departmentLookup[costCenter];
                }
                let departmentSearchObj = search.create({
                    type: "department",
                    filters:
                        [
                            ["isinactive", "is", "F"],
                            "AND",
                            ["custrecord_gmc_costcenter", "is", costCenter]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "name",
                                sort: search.Sort.ASC
                            })
                        ]
                });
                let searchResultCount = departmentSearchObj.runPaged().count;
                //log.debug("departmentSearchObj result count", searchResultCount);
                let departments = []
                departmentSearchObj.run().each(function (result) {
                    departments.push(result)
                    return true;
                });
                departmentLookup[costCenter] = departments;
                return departments;
            }

            function checkCustomSegment(target) {
                let G_Product_Line = 4;
                let segment = record.load({type: 'customsegment', id: G_Product_Line})
                let lineCount = segment.getLineCount({sublistId: 'segment_values'});
                for (let i = 0; i < lineCount; i++) {
                    let value = segment.getSublistValue({sublistId: 'segment_values', fieldId: 'value', line: i})
                    if (value === target) {
                        return true
                    }
                }
                return false
            }

            function checkCustomSegmentInternalProject(target) {
                let INTERNAL_PROJECT = 2;
                let segment = record.load({type: 'customsegment', id: INTERNAL_PROJECT})
                let lineCount = segment.getLineCount({sublistId: 'segment_values'});
                for (let i = 0; i < lineCount; i++) {
                    let value = segment.getSublistValue({sublistId: 'segment_values', fieldId: 'value', line: i})
                    if (value === target) {
                        return true
                    }
                }
                return false
            }

            function checkCustomSegmentReconciliation(target) {
                //異動碼
                let customrecord_csegprepaymentSearchObj = search.create({
                    type: "customrecord_csegprepayment",
                    filters:
                        [
                            ["isinactive", "is", "F"],
                            "AND",
                            ["name", "is", target]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "name",
                                sort: search.Sort.ASC
                            }),
                            "custrecord_prepayment_memo"
                        ]
                });
                let searchResultCount = customrecord_csegprepaymentSearchObj.runPaged().count;
                //log.debug("customrecord_csegprepaymentSearchObj result count", searchResultCount);
                let values = []
                customrecord_csegprepaymentSearchObj.run().each(function (result) {
                    values.push(result)
                    return true;
                });
                return values;
            }

            function insertCustomSegmentReconciliation(value) {
                //insert 異動碼
                let newCseqPrePayment = record.create({
                    type: 'customrecord_csegprepayment'
                });
                newCseqPrePayment.setValue({
                    fieldId: 'name',
                    value
                })
                newCseqPrePayment.save()
            }

            let locationLookup = {}
            function searchLocation(warehouseBank,sid) {
                if (locationLookup.hasOwnProperty(warehouseBank)) {
                    return locationLookup[warehouseBank];
                }
                let locationSearchObj = search.create({
                    type: "location",
                    filters:
                        [
                            ["isinactive", "is", "F"],
                            "AND",
                            ["custrecord_gmc_wh_code", "is", warehouseBank],
                            "AND",
                            ["subsidiary", "is", sid]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "name",
                                sort: search.Sort.ASC
                            }),
                            "phone",
                            "city",
                            "state",
                            "country",
                            "custrecord_gmc_wh_code",
                            "custrecord_gmc_wh_cost_center",
                            "custrecord_gmc_wh_acctount",
                            "custrecord_gmc_wh_acctount_s",
                            "cseg_gm_c_product_l",
                            "cseg_gm_c_market"
                        ]
                });
                let searchResultCount = locationSearchObj.runPaged().count;
                //log.debug("locationSearchObj result count", searchResultCount);
                let locations = []
                locationSearchObj.run().each(function (result) {
                    locations.push(result)
                    return true;
                });
                locationLookup[warehouseBank] = locations;
                return locations;
            }

            function searchLocation_v2(warehouseBank,subsidiary_id) {
                if (locationLookup.hasOwnProperty(warehouseBank)) {
                    return locationLookup[warehouseBank];
                }
                let locationSearchObj = search.create({
                    type: "location",
                    filters:
                        [
                            ["isinactive", "is", "F"],
                            "AND",
                            ["custrecord_gmc_wh_code", "is", warehouseBank],
                            "AND",
                            ["subsidiary", "is", subsidiary_id]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "name",
                                sort: search.Sort.ASC
                            }),
                            "phone",
                            "city",
                            "state",
                            "country",
                            "custrecord_gmc_wh_code",
                            "custrecord_gmc_wh_cost_center",
                            "custrecord_gmc_wh_acctount",
                            "custrecord_gmc_wh_acctount_s",
                            "cseg_gm_c_product_l",
                            "cseg_gm_c_market"
                        ]
                });
                let searchResultCount = locationSearchObj.runPaged().count;
                //log.debug("locationSearchObj_V2 warehouseBank", warehouseBank);
                //log.debug("locationSearchObj_V2 subsidiary_id", subsidiary_id);
                //log.debug("locationSearchObj_V2 result count", searchResultCount);
                let locations = []
                locationSearchObj.run().each(function (result) {
                    locations.push(result)
                    return true;
                });
                locationLookup[warehouseBank] = locations;
                return locations;
            }

            function searchMappingTableTxnType(category, group, trxType) {
                let customrecord_xxgl01_mapping_tempSearchObj = search.create({
                    type: "customrecord_xxgl01_mapping_temp",
                    filters:
                        [
                            ["isinactive", "is", "F"],
                            "AND",
                            [`formulanumeric: CASE WHEN LOWER({custrecord_gl01_m_txn_category})='${category.toLowerCase()}' THEN 1 ELSE 0 END`, "equalto", "1"],
                            "AND",
                            [`formulanumeric: CASE WHEN LOWER({custrecord_gl01_m_txn_group})='${group.toLowerCase()}' THEN 1 ELSE 0 END`, "equalto", "1"],
                            "AND",
                            ["custrecord_gl01_m_txn_type", "is", trxType]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "scriptid",
                                sort: search.Sort.ASC
                            }),
                            "custrecord_gl01_m_ledger",
                            "custrecord_gl01_m_mark",
                            "custrecord_gl01_m_txn_category",
                            "custrecord_gl01_m_txn_category_desc",
                            "custrecord_gl01_m_txn_group",
                            "custrecord_gl01_m_txn_group_desc",
                            "custrecord_gl01_m_txn_type",
                            "custrecord_gl01_m_txn_type_desc",
                            "custrecord_gl01_m_dr_cr",
                            "custrecord_gl01_m_company",
                            "custrecord_gl01_m_major",
                            "custrecord_gl01_m_minor",
                            "custrecord_gl01_m_local",
                            "custrecord_gl01_m_inter_com",
                            "custrecord_gl01_m_product_line",
                            "custrecord_gl01_m_costcenter",
                            "custrecord_gl01_m_market",
                            "custrecord_gl01_m_future",
                            "custrecord_gl01_m_reconcil_ref",
                            "custrecord_gl01_m_line_desc",
                            "custrecord_gl01_m_transaction_id",
                            "custrecord_gl01_m_status_check",
                            "custrecord_gl01_m_message_check",
                            "custrecord_gl01_m_status_insert",
                            "custrecord_gl01_m_message_insert"
                        ]
                });
                let searchResultCount = customrecord_xxgl01_mapping_tempSearchObj.runPaged().count;
                let mappings = []
                //log.debug("customrecord_xxgl01_mapping_tempSearchObj 2 result count", searchResultCount);
                customrecord_xxgl01_mapping_tempSearchObj.run().each(function (result) {
                    mappings.push(result)
                    return true;
                });
                return mappings;
            }

            function getHeaderValues(id) {
                let header = record.load({
                    type: 'customrecord_xxgl01_header_temp',
                    id: id
                });
                let headerId = id;
                let ledger = header.getValue({fieldId: 'custrecord_gl01_ledger'})
                let currency = header.getValue({fieldId: 'custrecord_gl01_currency'})
                let category = header.getValue({fieldId: 'custrecord_gl01_category_name'});
                let group = header.getValue({fieldId: 'custrecord_gl01_trx_group'});
                let glDateOriginal = header.getValue({fieldId: 'custrecord_gl01_gl_date'});
                let sourceSystem = header.getValue({fieldId: 'custrecord_gl01_source_system'});
                let rateType = header.getValue({fieldId: 'custrecord_gl01_rate_type'});
                let documentNumber = header.getValue({fieldId: 'custrecord_gl01_document_num'});
                let regex = /(.*)\+.*/.exec(glDateOriginal);
                let glDate = '';
                if (regex && regex.length > 1) {
                    glDate = regex[1].replace(/-/g, '/')
                } else {
                    regex = /(.*\/.*\/.*)\s.*/.exec(glDateOriginal)
                    if (regex.length > 1) {
                        glDate = regex[1]
                    }
                }
                let currentNum = header.getValue({
                    fieldId: 'custrecord_gl01_current_datanum'
                });
                return {headerId, ledger, currency, category, group, glDate, sourceSystem, rateType, documentNumber,currentNum}
            }

            function getHeaderCurrentNum(id,num){
                let header = record.load({
                    type: 'customrecord_xxgl01_header_temp',
                    id: id
                });

                let currentNum = header.getValue({
                    fieldId: 'custrecord_gl01_current_datanum'
                });

                header.setValue({
                    fieldId: 'custrecord_gl01_current_datanum',
                    value: num
                  });
                var recordIdAfterSave = header.save();

                log.debug("before currentNum", currentNum);

                return recordIdAfterSave;
            }

            function setdetailMark(id,mark){
                 let header = record.load({
                     type: 'customrecord_xxgl01_detail_temp',
                     id: id
                 });

                 let mark = header.getValue({
                     fieldId: 'custrecord_gl01_d_mark'
                 });

                 header.setValue({
                     fieldId: 'custrecord_gl01_d_mark',
                     value: mark
                   });
                 var recordIdAfterSave = header.save();

                 log.debug("before mark", mark);

                 return recordIdAfterSave;
            }

            let idByNameLookup = {}
            function searchIdByName(type, name) {
                let key = `${type}-${name}`;
                if (idByNameLookup.hasOwnProperty(key)) {
                    return idByNameLookup[key];
                }
                let searchObj = search.create({
                    type,
                    filters: [["name", "is", name]],
                    columns:
                        [
                            search.createColumn({
                                name: "name",
                                sort: search.Sort.ASC
                            }),
                            "scriptid"
                        ]
                });
                let ret = []
                searchObj.run().each(function (result) {
                    ret.push(result)
                    return true;
                });
                if (ret.length === 0) {
                    let newVar = record.create({
                        type: type
                    });
                    newVar.setValue({fieldId: 'name', value: name})
                    idByNameLookup[key] = newVar.save();
                    return idByNameLookup[key];
                }

                idByNameLookup[key] = ret[0].id;
                return ret[0].id;
            }

            function findGroupId(name) {
                //log.debug("findGroupId", name)
                let type = "customlist_gmc_trx_group";
                return searchIdByName(type, name);
            }

            function findCategoryId(name) {
                //log.debug("findCategoryId", name)
                let type = "customlist_gmc_category_name";
                return searchIdByName(type, name);
            }

            function findTrxTypeId(name) {
                let type = "customlist_gmc_trx_type"
                return searchIdByName(type, name)
            }

            function searchSameEdiHeadersStatus(ediId) {
                let customrecord_xxgl01_header_tempSearchObj = search.create({
                    type: "customrecord_xxgl01_header_temp",
                    filters:
                        [
                            ["isinactive", "is", "F"],
                            "AND",
                            ["custrecord_gl01_transaction_id", "anyof", ediId],
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "scriptid",
                                sort: search.Sort.ASC
                            }),
                            "custrecord_gl01_status_check",
                            "custrecord_gl01_status_insert",
                        ]
                });
                let searchResultCount = customrecord_xxgl01_header_tempSearchObj.runPaged().count;
                //log.debug("header in edi result count", searchResultCount);
                let headers = []
                //log.debug("header in edi SearchObj", searchResultCount);
                customrecord_xxgl01_header_tempSearchObj.run().each(function (result) {
                    headers.push(result)
                    return true;
                });
                return headers;
            }

            function parseSameEdiHeaderStatus(headerResult) {
                return {
                    id: headerResult.id,
                    checkStatus: headerResult.getValue({name: "custrecord_gl01_status_check"}),
                    insertStatus: headerResult.getValue({name: "custrecord_gl01_status_insert"}),
                };
            }

            function getEdiHeaders(ediId) {
                return searchSameEdiHeadersStatus(ediId).map(parseSameEdiHeaderStatus)
            }

            function searchSameEdiHeadersNotSucceed(ediId, targetField) {
                let customrecord_xxgl01_header_tempSearchObj = search.create({
                    type: "customrecord_xxgl01_header_temp",
                    filters:
                        [
                            ["custrecord_gl01_transaction_id", "anyof", ediId],
                            "AND",
                            [targetField, "isnot", "S"]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "scriptid",
                                sort: search.Sort.ASC
                            }),
                        ]
                });
                let searchResultCount = customrecord_xxgl01_header_tempSearchObj.runPaged().count;
                //log.debug("customrecord_xxgl01_header_tempSearchObj result count", searchResultCount);
                return searchResultCount
            }
            function sameEdiHeadersAllInsertSuccess(ediId) {
                let targetField = "custrecord_gl01_status_insert"
                let count = searchSameEdiHeadersNotSucceed(ediId, targetField);
                return count === 0;
            }

            function sameEdiHeadersAllCheckSuccess(ediId) {
                let targetField = "custrecord_gl01_status_check";
                let count = searchSameEdiHeadersNotSucceed(ediId, targetField);
                return count === 0;
            }
            
            return {
                searchSubsidiary,
                getHeaderCurrentNum,
                setdetailMark,
                searchAccountingPeriod,
                searchMappingTable,
                searchDetails,
                searchCustomer,
                searchVendor,
                parseDetailSearchResult,
                searchEmployee,
                parseEmployee,
                searchDepartment,
                checkCustomSegment,
                searchLocation,
                searchLocation_v2,
                searchMappingTableTxnType,
                checkCustomSegmentInternalProject,
                checkCustomSegmentReconciliation,
                insertCustomSegmentReconciliation,
                getHeaderValues,
                logRemainUsage,
                findGroupId,
                findCategoryId,
                findTrxTypeId,
                sameEdiHeadersAllInsertSuccess,
                sameEdiHeadersAllCheckSuccess,
                getEdiHeaders,
            };
        });
