/**
 * @NApiVersion 2.x
 * @NScriptType mapreducescript
 * @NModuleScope Public
 */
define(['N/encode', 'N/file', 'N/search', 'N/format', 'N/config', 'N/record', 'N/email', 'N/render', 'N/runtime', 'N/log', './commonCustFolderApi'],

	function (encode, file, search, format, config, record, email, render, runtime, log, custfolder) {

		// 1-30天、31-60天、61-90天、91-120天、121-150天、151-180天、181-360天、361-720天、 361-540天、541-720天、> 720天。
		const PERIOD_ARR = [
			{ "from": 0, "to": 30 },
			{ "from": 31, "to": 60 },
			{ "from": 61, "to": 90 },
			{ "from": 91, "to": 120 },
			{ "from": 121, "to": 150 },
			{ "from": 151, "to": 180 },
			{ "from": 181, "to": 360 },
			{ "from": 361, "to": 540 },
			{ "from": 541, "to": 720 },
			{ "from": 721, "to": 1080 },
			{ "from": 1081, "to": 9999 }
		];

		function getInputData(context) {
			log.debug("getInputData");
			return search.create({
				type: "item",
				filters: [
					["type", "anyof", "Assembly", "InvtPart"],
					"AND",
					//["internalid","anyof","954","980","1409","565","1556"]
					["internalid", "anyof", "1779", "1780"]
				],
				columns:
					[
						search.createColumn({ name: "name", label: "Name" }),
						//search.createColumn({name: "inventorylocation", label: "Inventory Location"})
					]
			});
		}

		function map(context) {
			log.debug("map");
			var obj = JSON.parse(context.value);
			//var itemlocation = obj.values.inventorylocation.value
			var scriptObj = runtime.getCurrentScript();
			var p_base_date = scriptObj.getParameter({ name: 'custscript_xxpr004_v2_base_date' });
			var baseDate = format.format({
				value: new Date(p_base_date),
				type: format.Type.DATE,
				timezone: format.Timezone.ASIA_TAIPEI
			});

			try {
				//#region Parameter
				var searchObj = getPeriodSearch(obj.id, "onorbefore", baseDate, baseDate, "");
				var in_TTL = 0;
				var in_amount = 0;
				var out_TTL = 0;
				var out_amount = 0;
				var itemid, displayname, salesdescription;  //category2, category3,
				var department, brand, location, internalid, itemclass, trans_status, createdfrom, createdfromtype;
				var trandate, tranid, trans_type, soInternalid, soTranid, soDate, soQuantity, soAmount, currency, exchangerate, soAmountTWD;
				var onHand = 0;
				var onHandAmount = 0;
				var in_date = "";
				var out_date = "";
				var in_check = true;
				var out_check = true;
				var in_first_amount = 0;
				var out_first_amount = 0;
				var location_name = [];
				var location_in_TTL = [];
				var location_out_TTL = [];
				var location_onHand = [];
				var PeriodObject = {};
				var Period_flag = false;
				//#endregion

				if (searchObj.runPaged().count > 0) {

					searchObj.run().each(function (result) {
						//log.debug("result",result);
						itemid = result.getValue({ name: 'itemid', join: "item", summary: "GROUP" });
						displayname = result.getValue({ name: 'displayname', join: "item", summary: "GROUP" });
						salesdescription = result.getValue({ name: 'salesdescription', join: "item", summary: "GROUP" });
						trans_type = result.getValue({ name: 'type', summary: "GROUP" });
						var sum = result.getValue({ name: 'quantity', summary: "SUM" });
						var amount = result.getValue({ name: 'amount', summary: "SUM" });
						var departmentID = result.getValue({ name: "custitemaeb_pm_code", join: "item", summary: "GROUP" });
						if (department == "") {
							var employeeRec = search.lookupFields({
								type: record.Type.EMPLOYEE,
								id: departmentID,
								columns: ['department'] //所屬department
							});
							department = employeeRec['department'];
							department = department[0].text;
						}
						brand = result.getText({ name: 'custitem_brand', join: "item", summary: "GROUP" });
						location = result.getValue({ name: 'name', join: "location", summary: "GROUP" });
						internalid = result.getValue({ name: 'internalid', join: "location", summary: "GROUP" });
						itemclass = result.getValue({ name: 'name', join: "class", summary: "GROUP" });
						trans_status = result.getText({ name: 'statusref', summary: "GROUP" });
						tranid = result.getValue({ name: 'tranid', summary: "GROUP" });
						createdfromtype = result.getText({ name: "type", join: "createdFrom", summary: "GROUP" });
						trandate = result.getValue({ name: 'trandate', summary: "GROUP" });
						//log.debug("trandate",trandate);
						//var tradingdate = result.getValue({name: 'custcol_om_recent_trading_day',summary: "GROUP"});
						location_name[internalid] = location;

						if (!PeriodObject[obj.id + "_" + internalid]) {
							PeriodObject[obj.id + "_" + internalid] = []
						}
						if ((trans_type == "ItemRcpt" && createdfromtype != "Transfer Order") ||
							(trans_type == "InvAdjst" && Number(sum) > 0) ||
							(trans_type == "Build" && Number(sum) > 0) ||
							(trans_type == "Unbuild" && Number(sum) > 0)) {
							//if(trans_type == "InvAdjst"){
							//trandate = tradingdate;
							//}
							PeriodObject[obj.id + "_" + internalid].push({
								'itemid': obj.id,
								"trandate": trandate,
								"location": internalid,
								"tranid": tranid,
								"sum": sum
							})

							//log.debug("PeriodObject",PeriodObject);
						}
						if ((trans_type == "InvTrnfr" && Number(sum) > 0) ||
							(trans_type == "TrnfrOrd" && Number(sum) > 0)) {
							Period_flag = true;
						}
						//log.debug(location,"tranid="+tranid+",trans_type="+trans_type+",trandate="+trandate+",createdfromtype="+createdfromtype+",sum="+sum);

						//進貨
						//log.debug("searchObj trans_type",trans_type);
						if (trans_type == "ItemRcpt" ||
							trans_type == "InvAdjst" ||
							trans_type == "InvTrnfr" ||
							trans_type == "Unbuild") {
							in_TTL = Number(in_TTL) + Number(sum);
							in_amount = Number(in_amount) + Number(amount);
							location_in_TTL[internalid] = Number(NVL(location_in_TTL[internalid])) + Number(sum);
							//log.debug(location,"tranid="+tranid+",trans_type="+trans_type+",trandate="+trandate+",createdfromtype="+createdfromtype+",sum="+sum);
						}
						else //出貨
						{
							if (trans_status == "驗收完成" || trans_type == "Build" || trans_type == "VendCred") {
								out_TTL = Number(out_TTL) + Number(sum);
								out_amount = Number(out_amount) + Number(amount);
								location_out_TTL[internalid] = Number(NVL(location_out_TTL[internalid])) + Number(sum);
								//log.debug(location,"tranid="+tranid+",trans_type="+trans_type+",trandate="+trandate+",createdfromtype="+createdfromtype+",sum="+sum);
							}
						}

						//log.debug(itemid,"IN:"+in_TTL+" , OUT:"+out_TTL);
						onHand = in_TTL + out_TTL;
						onHandAmount = in_amount + out_amount;
						location_onHand[internalid] = NVL(location_in_TTL[internalid]) + NVL(location_out_TTL[internalid]);
						return true;
					});

					var averagecost = onHandAmount / onHand;
					//log.debug("averagecost",averagecost);
					location_name.forEach(function (result, location_index) {
						var writePeriod = [];
						var dayArray = [];
						var writePeriod_So = [];
						PERIOD_ARR.forEach(function (result, index) {
							writePeriod[index] = 0;
							writePeriod_So[index] = 0;
							dayArray[index] = '';
						});

						var onHand_temp = location_onHand[location_index]; //當on hand都扣完，就不繼續撈
						//log.debug("onHand_temp",onHand_temp);
						//log.debug("location_onHandAmount[location_index]",location_onHandAmount[location_index]);
						if (location_onHand[location_index] != 0) {
							PERIOD_ARR.forEach(function (result, index) {

								if (onHand_temp > 0) {
									var from = result['from'];
									var to = result['to'];

									var newdate = new Date(baseDate);
									var newdate2 = new Date(baseDate);

									newdate.setDate(newdate.getDate() - from); // minus the date
									newdate2.setDate(newdate2.getDate() - to); // minus the date

									var baseDate_1 = format.format({
										value: new Date(newdate),
										type: format.Type.DATE,
										timezone: format.Timezone.ASIA_TAIPEI
									});
									var baseDate_2 = format.format({
										value: new Date(newdate2),
										type: format.Type.DATE,
										timezone: format.Timezone.ASIA_TAIPEI
									});

									var periodObj = getPeriodSearch(obj.id, "within", baseDate_2, baseDate_1, location_index);
									var period_in_TTL = 0;
									var period_out_TTL = 0;
									var againgDay = '';
									soInternalid = '';
									periodObj.run().each(function (result) {
										itemid = result.getValue({ name: 'itemid', join: "item", summary: "GROUP" });
										trans_type = result.getValue({ name: 'type', summary: "GROUP" });
										var sum = result.getValue({ name: 'quantity', summary: "SUM" });
										var amount = result.getValue({ name: 'amount', summary: "SUM" });
										var trans_status = result.getText({ name: 'statusref', summary: "GROUP" });
										tranid = result.getValue({ name: 'tranid', summary: "GROUP" });
										createdfrom = result.getValue({ name: "tranid", join: "createdFrom", summary: "GROUP" });	//PO Number
										createdfromtype = result.getText({ name: "type", join: "createdFrom", summary: "GROUP" });
										var trandateTest = result.getValue({ name: 'trandate', summary: "GROUP" });

										//進貨
										//log.debug("location_name trans_type",trans_type);
										if ((trans_type == "ItemRcpt" && createdfromtype != "Transfer Order") ||
											(trans_type == "InvAdjst" && Number(sum) > 0) ||
											(trans_type == "Build" && Number(sum) > 0) ||
											(trans_type == "Unbuild" && Number(sum) > 0)) {
											if (in_check && trans_type == "ItemRcpt") {
												in_date = trandate
												in_first_amount = Number(amount) / Number(sum);
												in_check = false;
											}
											period_in_TTL = Number(period_in_TTL) + Number(sum);
											againgDay = trandateTest;
										}
										else {
											if (trans_status == "驗收完成" || trans_type == "VendCred") {
												if (out_check) {
													out_date = trandate
													out_first_amount = Number(amount) / Number(sum);
													out_check = false;
												}
												period_out_TTL = Number(period_out_TTL) + Number(sum);
											}
										}
										return true;

									});
									//log.debug(location_name[location_index],"onHand_temp="+onHand_temp+",period_in_TTL="+period_in_TTL);
									//log.debug("writePeriod 1",writePeriod);
									//log.debug("dayArray 1",dayArray);
									//log.debug("onHand_temp",onHand_temp);

									var periodsum = 0;
									if (onHand_temp - period_in_TTL >= 0) {
										writePeriod[index] = Number(period_in_TTL);
										dayArray[index] = againgDay;
										periodsum = Number(period_in_TTL);

									} else {
										writePeriod[index] = Number(onHand_temp);
										dayArray[index] = againgDay;
										periodsum = Number(onHand_temp);
									}
									//log.debug("writePeriod 2",writePeriod);
									//log.debug("dayArray 2",dayArray);
									//log.debug("//////////////");
									// 收料與開帳資料減掉onHand = 可以讓其他倉庫剩餘onHand扣除
									for (var d = 0; d < PeriodObject[obj.id + "_" + location_index].length;) {
										if (periodsum > 0) {
											if (Number(periodsum) >= Number(PeriodObject[obj.id + "_" + location_index][d]["sum"])) {
												periodsum = Number(periodsum) - Number(PeriodObject[obj.id + "_" + location_index][d]["sum"]);
												PeriodObject[obj.id + "_" + location_index].splice(d, 1);
											} else {
												PeriodObject[obj.id + "_" + location_index][d]["sum"] = Number(PeriodObject[obj.id + "_" + location_index][d]["sum"]) - Number(periodsum);
												periodsum = 0;
											}
										} else {
											d = PeriodObject[obj.id + "_" + location_index].length;
										}
									}

									onHand_temp = onHand_temp - period_in_TTL;
									writePeriod_So[index] = period_out_TTL * -1;
								}
							});
							//查詢SO單
							soTranid = '';
							soAmount = '';
							soDate = '';
							soQuantity = '';
							currency = '';
							exchangerate = '';
							soAmountTWD = '';
							soRate = '';
							soDepartment = '';
							soSales = '';
							var newdate1 = new Date(baseDate);
							var newdate2 = new Date(baseDate);

							newdate1.setDate(newdate1.getDate() - 365); // minus the date
							newdate2.setDate(newdate2.getDate()); // minus the date
							var baseDate_1 = format.format({
								value: new Date(newdate1),
								type: format.Type.DATE,
								timezone: format.Timezone.ASIA_TAIPEI
							});
							var baseDate_2 = format.format({
								value: new Date(newdate2),
								type: format.Type.DATE,
								timezone: format.Timezone.ASIA_TAIPEI
							});

							var SO_Object = getSalesOrder(obj.id, baseDate_1, baseDate_2);
							//log.debug('SO_Object',SO_Object);
							soTranid = SO_Object['tranid'];
							soAmount = SO_Object['amount'];
							soDate = SO_Object['trandate'];
							soQuantity = SO_Object['quantity'];
							currency = SO_Object['currency'];
							exchangerate = SO_Object['exchangerate'];
							soAmountTWD = soAmount * exchangerate;
							soRate = SO_Object['rate'];
							soDepartment = SO_Object['department'];
							soSales = SO_Object['salesrep'];

							log.debug("整理Array");
							var newDayArray = dayArray.filter(function (element) {
								return element !== "";
							});

							var newWritePeriod = writePeriod.filter(function (element) {
								return element !== 0;
							});

							//紀錄againg和Inv_QTY
							var data = {};
							for (var i = 0; i < newWritePeriod.length; i++) {
								var key = "data" + (i + 1);
								data[key] = {
									'againg': newDayArray[i],
									'inv_qty': newWritePeriod[i]
								};
							}

							log.debug("Data", data);
							//調倉判斷
							if (Number(onHand_temp) > 0) {
								//log.debug("有調倉",obj.id+"_"+location_index)
								context.write({
									key: obj.id,
									value: {
										'Data': data,
										'itemid': itemid,
										'displayname': displayname,
										'salesdescription': salesdescription,
										'currentSold': writePeriod_So[0], //currentSold,current_out_TTL
										'ttlQTY': location_onHand[location_index], //存貨數量
										'ttlAMT': Number(location_onHand[location_index]) * averagecost, //ttlAMT,
										'onHand_temp': Number(onHand_temp),
										'averagecost': averagecost,
										'trandate': trandate,
										'_0_30': writePeriod[0],
										'_31_60': writePeriod[1],
										'_61_90': writePeriod[2],
										'_91_120': writePeriod[3],
										'_121_150': writePeriod[4],
										'_151_180': writePeriod[5],
										'_181_360': writePeriod[6],
										'_361_540': writePeriod[7],
										'_541_720':
											'_721_1080' : writePeriod[9],
										'_1081_9999': writePeriod[10],
										'_0_30_COST': Number(writePeriod[0]) * averagecost,
										'_31_60_COST': Number(writePeriod[1]) * averagecost,
										'_61_90_COST': Number(writePeriod[2]) * averagecost,
										'_91_120_COST': Number(writePeriod[3]) * averagecost,
										'_121_150_COST': Number(writePeriod[4]) * averagecost,
										'_151_180_COST': Number(writePeriod[5]) * averagecost,
										'_181_360_COST': Number(writePeriod[6]) * averagecost,
										'_361_540_COST': Number(writePeriod[7]) * averagecost,
										'_541_720_COST': Number(writePeriod[8]) * averagecost,
										'_721_1080_COST': Number(writePeriod[9]) * averagecost,
										'_1081_9999_COST': Number(writePeriod[10]) * averagecost,
										'department': department,
										'brand': brand,
										'location': location_name[location_index],
										'location_index': location_index,
										'itemclass': itemclass,
										'in_date': in_date,
										'in_amount': in_first_amount,
										'out_date': out_date,
										'out_amount': out_first_amount,
										'so_qty': out_TTL * -1,
										'soTranid': soTranid,
										'soDate': soDate,
										'soQuantity': soQuantity,
										'soAmount': soAmount,
										'currency': currency,
										'soAmountTWD': soAmountTWD,
										'soRate': soRate,
										'soDepartment': soDepartment,
										'soSales': soSales
									}
								});
							} else {
								//log.debug("無調倉",obj.id+"_"+location_index)
								context.write({
									key: obj.id + "_" + location_index,
									value: {
										'Data': data,
										'itemid': itemid,
										'displayname': displayname,
										'salesdescription': salesdescription,
										'currentSold': writePeriod_So[0], //currentSold,current_out_TTL
										'ttlQTY': location_onHand[location_index], //存貨數量
										'ttlAMT': Number(location_onHand[location_index]) * averagecost, //ttlAMT,
										'onHand_temp': Number(onHand_temp),
										'averagecost': averagecost,
										'trandate': trandate,
										'_0_30': writePeriod[0],
										'_31_60': writePeriod[1],
										'_61_90': writePeriod[2],
										'_91_120': writePeriod[3],
										'_121_150': writePeriod[4],
										'_151_180': writePeriod[5],
										'_181_360': writePeriod[6],
										'_361_540': writePeriod[7],
										'_541_720': writePeriod[8],
										'_721_1080': writePeriod[9],
										'_1081_9999': writePeriod[10],
										'_0_30_COST': Number(writePeriod[0]) * averagecost,
										'_31_60_COST': Number(writePeriod[1]) * averagecost,
										'_61_90_COST': Number(writePeriod[2]) * averagecost,
										'_91_120_COST': Number(writePeriod[3]) * averagecost,
										'_121_150_COST': Number(writePeriod[4]) * averagecost,
										'_151_180_COST': Number(writePeriod[5]) * averagecost,
										'_181_360_COST': Number(writePeriod[6]) * averagecost,
										'_361_540_COST': Number(writePeriod[7]) * averagecost,
										'_541_720_COST': Number(writePeriod[8]) * averagecost,
										'_721_1080_COST': Number(writePeriod[9]) * averagecost,
										'_1081_9999_COST': Number(writePeriod[10]) * averagecost,
										'department': department,
										'brand': brand,
										'location': location_name[location_index],
										'location_index': location_index,
										'itemclass': itemclass,
										'in_date': in_date,
										'in_amount': in_first_amount,
										'out_date': out_date,
										'out_amount': out_first_amount,
										'so_qty': out_TTL * -1,
										'soTranid': soTranid,
										'soDate': soDate,
										'soQuantity': soQuantity,
										'soAmount': soAmount,
										'currency': currency,
										'soAmountTWD': soAmountTWD,
										'soRate': soRate,
										'soDepartment': soDepartment,
										'soSales': soSales,
									}
								});
							}


						}
					});

					if (Period_flag) {
						context.write({
							key: obj.id,
							value: {
								'PeriodObject': PeriodObject
							}
						});
					}
				}
			}
			catch (e) {
				log.debug("map error", e.message);
			}
		}

		function reduce(context) {
			try {
				log.debug("reduce");
				var scriptObj = runtime.getCurrentScript();
				var p_base_date = scriptObj.getParameter({ name: 'custscript_xxpr004_v2_base_date' });
				var writePeriod = [];
				var dayArray = [];
				for (var i = 0; i < PERIOD_ARR.length; i++) {
					writePeriod[i] = 0;
					dayArray[i] = '';
				}
				//var p_base_date = '2022/06/29';
				var baseDate = format.format({
					value: new Date(p_base_date),
					type: format.Type.DATE,
					timezone: format.Timezone.ASIA_TAIPEI
				});
				if (context.values.length == 1) {
					context.write({
						key: context.key,
						value: JSON.parse(context.values[0])
					});
				} else {
					var Period = "";
					var PeriodObject = "";
					for (var i = 0; i < context.values.length; i++) {
						if (JSON.parse(context.values[i]).PeriodObject) {
							PeriodObject = JSON.parse(context.values[i]).PeriodObject;
						}
					}

					for (var i = 0; i < context.values.length; i++) {
						var obj = JSON.parse(context.values[i]);
						if (!obj.PeriodObject) {
							//log.debug("reduce obj",obj);
							Period = obj;
							for (var per in PeriodObject) {
								if (PeriodObject.hasOwnProperty(per)) {
									if (PeriodObject[per].length > 0 && Number(Period["onHand_temp"]) > 0) {
										//log.debug("尋找其他倉"+per,PeriodObject[per]);
										for (var l = 0; l < PeriodObject[per].length; l++) {
											var PeriodDate = new Date(PeriodObject[per][l]["trandate"]);

											if (Number(Period["onHand_temp"]) >= Number(PeriodObject[per][l]["sum"])) {
												PERIOD_ARR.forEach(function (result, index) {
													var from = result['from'];
													var to = result['to'];

													var newdate = new Date(baseDate);
													var newdate2 = new Date(baseDate);

													newdate.setDate(newdate.getDate() - from); // minus the date
													newdate2.setDate(newdate2.getDate() - to); // minus the date

													if (PeriodDate <= newdate && PeriodDate >= newdate2) {
														Period["_" + from + "_" + to] = Number(Period["_" + from + "_" + to]) + Number(PeriodObject[per][l]["sum"]);
														Period["_" + from + "_" + to + "_COST"] = Number(Period["_" + from + "_" + to]) * Number(Period["averagecost"]);
														Period["onHand_temp"] = Number(Period["onHand_temp"]) - Number(PeriodObject[per][l]["sum"]);
														PeriodObject[per][l]["sum"] = 0;

														writePeriod[index] = Period["_" + from + "_" + to];
														dayArray[index] = PeriodObject[per][l]["trandate"];
													}
												});
											} else {
												PERIOD_ARR.forEach(function (result, index) {
													var from = result['from'];
													var to = result['to'];

													var newdate = new Date(baseDate);
													var newdate2 = new Date(baseDate);

													newdate.setDate(newdate.getDate() - from); // minus the date
													newdate2.setDate(newdate2.getDate() - to); // minus the date

													if (PeriodDate <= newdate && PeriodDate >= newdate2) {
														//log.debug("2222-2");
														Period["_" + from + "_" + to] = Number(Period["_" + from + "_" + to]) + Number(Period["onHand_temp"]);
														Period["_" + from + "_" + to + "_COST"] = Number(Period["_" + from + "_" + to]) * Number(Period["averagecost"]);
														PeriodObject[per][l]["sum"] = Number(PeriodObject[per][l]["sum"]) - Number(Period["onHand_temp"]);
														Period["onHand_temp"] = 0;

														writePeriod[index] = Period["_" + from + "_" + to];
														dayArray[index] = PeriodObject[per][l]["trandate"];
													}
												});
											}
										}
									}
								}
							}
							// 重新整理
							var onHand_temp = Period.ttlQTY;

							PERIOD_ARR.forEach(function (result, index) {

								var from = result['from'];
								var to = result['to'];

								//log.debug("onHand_temp",onHand_temp);
								if (Number(onHand_temp) > 0) {

									//log.debug("_"+from+"_"+to,Number(Period["_"+from+"_"+to]));
									if (Number(onHand_temp) - Number(Period["_" + from + "_" + to]) >= 0) {
										onHand_temp = Number(onHand_temp) - Number(Period["_" + from + "_" + to]);
									} else {
										Period["_" + from + "_" + to] = Number(onHand_temp);

										Period["_" + from + "_" + to + "_COST"] = Number(onHand_temp) * Number(Period["averagecost"]);
										onHand_temp = 0;
									}
								} else {
									Period["_" + from + "_" + to] = 0;
									Period["_" + from + "_" + to + "_COST"] = 0;
								}
							});

							//紀錄againg和Inv_QTY
							var newDayArray = dayArray.filter(function (element) {
								return element !== "";
							});

							var newWritePeriod = writePeriod.filter(function (element) {
								return element !== 0;
							});

							//紀錄againg和Inv_QTY
							for (var i = 0; i < newWritePeriod.length; i++) {
								var key = "data" + (i + 1);
								Period.Data[key] = {
									'againg': newDayArray[i],
									'inv_qty': newWritePeriod[i]
								};
							}

							log.debug("reduce Period", Period);
							context.write({
								key: context.key + "_" + Period["location_index"],
								value: Period
							});
						}
					}
				}
			} catch (e) {
				log.debug("reduce error:", e.message);
			}
		}

		function summarize(context) {
			try {
				var scriptObj = runtime.getCurrentScript();
				var p_base_date = scriptObj.getParameter({ name: 'custscript_xxpr004_v2_base_date' });
				//var p_base_date = '2022/06/29';
				var tw = format.format({
					value: new Date(p_base_date),  //date,
					type: format.Type.DATETIME,
					timezone: format.Timezone.ASIA_TAIPEI
				});
				tw = new Date(tw);
				var year = tw.getFullYear();
				var month = tw.getMonth() + 1;
				var day = tw.getDate();

				var base_date = month + '/' + day + '/' + year;
				var base_date_V2 = year + '/' + month + '/' + day;
				runExcel(context, base_date, base_date_V2);
			} catch (e) {
				log.debug("summarize error:", e.message);
			}
		}

		//#region Function
		function getPeriodSearch(itemid, type, fromDate, toDate, locationid) {
			var filters = [
				["type", "anyof", "InvAdjst", "ItemShip", "ItemRcpt", "InvTrnfr", "TrnfrOrd", "Unbuild", "Build", "VendCred"],
				"AND", ["shipping", "is", "F"],
				//  "AND",["mainline","is","F"],
				"AND", ["taxline", "is", "F"],
				"AND", ["account.type", "anyof", "OthCurrAsset"],
				//"AND",["formuladate: CASE WHEN {type}='Inventory Adjustment' THEN {custcol_om_recent_trading_day} ELSE {trandate} END","within",fromDate,toDate],
				"AND", ["formuladate: {trandate}", "within", fromDate, toDate],
				"AND", ["item.internalid", "anyof", itemid],
				"AND", ["location", "anyof", locationid]
			];

			if (type == "onorbefore") {
				filters = [
					["type", "anyof", "InvAdjst", "ItemShip", "ItemRcpt", "InvTrnfr", "TrnfrOrd", "Unbuild", "Build", "VendCred"],
					"AND", ["shipping", "is", "F"],
					//  "AND",["mainline","is","F"],
					"AND", ["taxline", "is", "F"],
					"AND", ["account.type", "anyof", "OthCurrAsset"],
					//"AND",["formuladate: CASE WHEN {type}='Inventory Adjustment' THEN {custcol_om_recent_trading_day} ELSE {trandate} END","onorbefore",fromDate,fromDate],
					"AND", ["formuladate: {trandate}", "onorbefore", fromDate],
					"AND", ["item.internalid", "anyof", itemid]
				];
				//暫時  需要調整
				if (locationid != "") {
					filters = [
						["type", "anyof", "InvAdjst", "ItemShip", "ItemRcpt", "InvTrnfr", "TrnfrOrd", "Unbuild", "Build", "VendCred"],
						"AND", ["shipping", "is", "F"],
						//  "AND",["mainline","is","F"],
						"AND", ["taxline", "is", "F"],
						"AND", ["account.type", "anyof", "OthCurrAsset"],
						//"AND",["formuladate: CASE WHEN {type}='Inventory Adjustment' THEN {custcol_om_recent_trading_day} ELSE {trandate} END","onorbefore",fromDate,fromDate],
						"AND", ["formuladate: {trandate}", "onorbefore", fromDate],
						"AND", ["item.internalid", "anyof", itemid],
						"AND", ["location", "anyof", locationid]
					];
				}
			}

			var inventoryitemSearchObj = search.create({
				type: "transaction",
				filters: filters,
				columns:
					[
						search.createColumn({ name: "itemid", join: "item", summary: "GROUP", label: "Name" }),
						search.createColumn({ name: "displayname", join: "item", summary: "GROUP", label: "Display Name" }),
						search.createColumn({ name: "salesdescription", join: "item", summary: "GROUP", label: "Description" }),
						search.createColumn({ name: "type", join: "item", summary: "GROUP", label: "Type" }),
						search.createColumn({ name: "department", join: "item", summary: "GROUP", label: "Department" }),
						search.createColumn({ name: "custitemaeb_pm_code", join: "item", summary: "GROUP", label: "PM Code" }),
						//search.createColumn({name: "custitemaeb_buyer_code",join: "item", summary: "GROUP", label: "Buyer Code"}),
						search.createColumn({ name: "custitem_brand", join: "item", summary: "GROUP", label: "品牌" }),
						search.createColumn({ name: "name", join: "location", summary: "GROUP", label: "name" }),
						search.createColumn({ name: "internalid", join: "location", summary: "GROUP", label: "internalid" }),
						search.createColumn({ name: "name", join: "class", summary: "GROUP", label: "name" }),
						search.createColumn({ name: "trandate", summary: "GROUP", sort: search.Sort.DESC, label: "Date" }),
						//search.createColumn({name: "custcol_om_recent_trading_day", summary: "GROUP",sort: search.Sort.DESC, label: "Trading Date"}),
						search.createColumn({ name: "type", summary: "GROUP", label: "Type" }),
						search.createColumn({ name: "quantity", summary: "SUM", label: "Quantity" }),
						search.createColumn({ name: "amount", summary: "SUM", label: "Amount" }),
						search.createColumn({ name: "statusref", summary: "GROUP", label: "Status" }),
						search.createColumn({ name: "tranid", summary: "GROUP", label: "Document Number" }),
						search.createColumn({ name: "tranid", join: "createdFrom", summary: "GROUP", label: "Document Number" }),
						search.createColumn({ name: "type", join: "createdFrom", summary: "GROUP", label: "Type" }),
					]
			});
			return inventoryitemSearchObj;
		}

		function runExcel(context, base_date, base_date_V2) {
			try {
				var userObj = runtime.getCurrentUser();

				var xmlString = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
				xmlString += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
				xmlString += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
				xmlString += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
				xmlString += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
				xmlString += 'xmlns:html="http://www.w3.org/TR/REC-html40">';
				xmlString += '<Styles>';
				xmlString += '<Style ss:ID="number1">';
				xmlString += '<Alignment ss:Horizontal="Right" ss:Vertical="Center"/>';
				xmlString += '<NumberFormat ss:Format="#,##0_);[Red]\(#,##0\)"/>';
				xmlString += '</Style>';
				xmlString += '<Style ss:ID="number2">';
				xmlString += '<Alignment ss:Horizontal="Right" ss:Vertical="Center"/>';
				xmlString += '<NumberFormat ss:Format="#,##0.000_);[Red]\(#,##0.000\)"/>';
				xmlString += '</Style>';
				xmlString += '</Styles>';
				xmlString += '<Worksheet ss:Name="Sheet1">';
				xmlString += '<Table>';

				xmlString += '<Row>' +
					'<Cell><Data ss:Type="String">Item Name/Number : Part Number</Data></Cell>' +
					'<Cell><Data ss:Type="String">Display Name/Code : Part Description</Data></Cell>' +
					'<Cell><Data ss:Type="String">Location</Data></Cell>' +
					'<Cell><Data ss:Type="String">AVERAGE COST</Data></Cell>' +
					'<Cell><Data ss:Type="String">Selling Qty in current month </Data></Cell>' +
					'<Cell><Data ss:Type="String">Total Qty </Data></Cell>' +
					'<Cell><Data ss:Type="String">Total Amt </Data></Cell>' +
					//20230710
					'<Cell><Data ss:Type="String">Inventory QTY </Data></Cell>' +
					'<Cell><Data ss:Type="String">Inventory Date </Data></Cell>' +
					'<Cell><Data ss:Type="String">Aging Days </Data></Cell>' +
					'</Row>';

				context.output.iterator().each(function (key, value) {
					//log.debug(key,value);
					var details = JSON.parse(value);
					if (details.ttlQTY > 0) {
						xmlString = writeXml(details, xmlString, base_date_V2);
					}
					return true;
				});

				xmlString += '</Table></Worksheet></Workbook>';
				//encode contents

				var base64EncodedString = encode.convert({
					string: xmlString,
					inputEncoding: encode.Encoding.UTF_8,
					outputEncoding: encode.Encoding.BASE_64
				});

				//create file
				var folderId = custfolder.getUserFolder(runtime.getCurrentUser().name, '客製報表');
				var xlsFile = file.create({ name: '庫齡.xls', fileType: 'EXCEL', contents: base64EncodedString, folder: folderId });
				xlsFile.save();
			} catch (e) {
				throw 'runExcel error：' + e.message;
			}
		}

		function writeXml(detail, xmlString, base_date_V2) {
			try {
				log.debug("detail", detail);
				var averagecost = Number(NVL(detail.ttlAMT / detail.ttlQTY));
				var toDay = new Date(base_date_V2);

				for (var key in detail.Data) {
					//log.debug("key",key);
					if (detail.Data.hasOwnProperty(key)) {
						var againgValue = detail.Data[key].againg;
						//log.debug("againg",againgValue);
						var invQtyValue = detail.Data[key].inv_qty;
						//log.debug("inv_qty",invQtyValue);

						var tranDate = new Date(againgValue);
						//計算天數差異
						var timeDiff = Math.abs(toDay.getTime() - tranDate.getTime());
						var daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

						xmlString += '<Row>' +
							'<Cell><Data ss:Type="String">' + detail.itemid + '</Data></Cell>' +
							'<Cell><Data ss:Type="String">' + detail.displayname + '</Data></Cell>' +
							'<Cell><Data ss:Type="String">' + (detail.location || '') + '</Data></Cell>';

						if (isFloat(averagecost)) {
							xmlString += '<Cell ss:StyleID="number2"><Data ss:Type="Number">' + NVL(averagecost) + '</Data></Cell>';
						} else {
							xmlString += '<Cell ss:StyleID="number1"><Data ss:Type="Number">' + NVL(averagecost) + '</Data></Cell>';
						}

						xmlString += '<Cell ss:StyleID="number1"><Data ss:Type="Number">' + NVL(detail.currentSold) + '</Data></Cell>' +
							'<Cell ss:StyleID="number1"><Data ss:Type="Number">' + NVL(detail.ttlQTY) + '</Data></Cell>' +
							'<Cell ss:StyleID="number1"><Data ss:Type="Number">' + NVL(detail.ttlAMT) + '</Data></Cell>' +
							//20230710
							'<Cell ss:StyleID="number1"><Data ss:Type="Number">' + NVL(invQtyValue) + '</Data></Cell>' +
							'<Cell ss:StyleID="number1"><Data ss:Type="String">' + (againgValue || '') + '</Data></Cell>' +
							'<Cell ss:StyleID="number1"><Data ss:Type="Number">' + daysDiff + '</Data></Cell>' +
							//
							'</Row>';
					}
				}
				return xmlString;
			} catch (e) {
				throw 'writeXml error：' + e.message;
			}
		}

		function NVL(n) {
			return (n ? n : 0);
		}

		function isFloat(n) {
			return n === n && n !== (n | 0);
		}

		function getTransfer(RecordType, TransType, TransferNo, itemid, quantity, trnfravg) {
			try {
				//log.debug("TransferNo",TransferNo);
				var TransDate = "";
				var fromLoctionID = "";
				//判斷是哪個倉轉過來的
				var inventorytransferSearchObj = search.create({
					type: RecordType,
					filters:
						[
							["type", "anyof", TransType],
							"AND",
							["numbertext", "is", TransferNo],
							"AND",
							["mainline", "is", "T"]
						],
					columns:
						[
							search.createColumn({ name: "trandate", sort: search.Sort.ASC, label: "Date" }),
							search.createColumn({ name: "location", label: "Location" })
						]
				});
				inventorytransferSearchObj.run().each(function (result) {
					TransDate = result.getValue({ name: "trandate", sort: search.Sort.ASC });
					fromLoctionID = result.getValue({ name: "location" });
					return true;
				});
				var in_TTL = 0;
				var in_Arr = [];
				var baseDate = format.format({
					value: new Date(TransDate),
					type: format.Type.DATE,
					timezone: format.Timezone.ASIA_TAIPEI
				});
				var searchObj = getPeriodSearch(itemid, "onorbefore", baseDate, baseDate, fromLoctionID);
				searchObj.run().each(function (result) {
					var trans_type = result.getValue({ name: 'type', summary: "GROUP" });
					var sum = result.getValue({ name: 'quantity', summary: "SUM" });
					var amount = Number(sum) * trnfravg;
					var trandate = result.getValue({ name: 'trandate', summary: "GROUP" });
					if (((trans_type == "ItemRcpt" && Number(sum) > 0) || (trans_type == "InvAdjst" && Number(sum) > 0) || trans_type == "Unbuild") && quantity > 0) {
						if (Number(sum) >= Number(quantity)) {
							in_Arr.push(new generateINElement(trandate, quantity, Number(quantity) * trnfravg));
							quantity = 0;
						} else {
							in_Arr.push(new generateINElement(trandate, sum, Number(sum) * trnfravg));
							quantity = Number(quantity) - Number(sum);
						}
					}
					return true;
				});
				return in_Arr;
			} catch (error) {
				log.debug(error.name, error.message);
			}
		}

		function generateINElement(trandate, sum, amount) {
			this.trandate = trandate;
			this.sum = sum;
			this.amount = amount;
		}

		function getMinInvoice(internalId) {
			var column = search.createColumn({
				name: 'datecreated',
				join: 'custrecord_ar_invoice_no',
				sort: search.Sort.ASC
			});
			var invoiceSearch = search.create({
				type: 'customrecord_ev_invoice_list',
				columns: ['custrecord_ar_invoice_no.createdfrom',
					'custrecord_ar_invoice_no.tranid',
					column],
				filters: [['custrecord_ar_no', 'is', internalId],
					'and', ['custrecord_ar_invoice_no.mainline', 'is', 'T']]
			});
			var tranid;
			invoiceSearch.run().each(function (result) {
				tranid = result.getValue({
					name: 'tranid',
					join: 'custrecord_ar_invoice_no'
				});
				return false;
			});
			return tranid;
		}

		function getAppliedAmount(guiNo) {
			var amount = 0;
			var customerPaymentSearch = search.create({
				type: search.Type.CUSTOMER_PAYMENT,
				columns: ['amount'],
				filters: [
					['mainline', 'is', 'T'],
					'and', ['custbody_om_applyguino', 'is', guiNo]
				]
			});
			customerPaymentSearch.run().each(function (result) {
				var amountpaid = result.getValue({
					name: 'amount'
				});
				amount += parseInt(amountpaid);
				return true;
			});
			return amount;
		}

		function getNTDAmount(guiNo) {
			var amount = 0;
			var ntdAmountSearch = search.create({
				type: 'customrecord_ev_rec_cm_lines_all',
				columns: ['custrecord_4_line_ntd_amount',
					'custrecord_4_tax_ntd_amount'],
				filters: [
					['custrecord_4_prev_gui_id', 'is', guiNo]
				]
			});
			ntdAmountSearch.run().each(function (result) {
				var ntdAmount = result.getValue({
					name: 'custrecord_4_line_ntd_amount'
				});
				var ntdTaxAmount = result.getValue({
					name: 'custrecord_4_tax_ntd_amount'
				});
				amount += parseInt(ntdAmount);
				amount += parseInt(ntdTaxAmount);
				return true;
			});
			return amount;
		}

		function getCustomerDeposit(guiNo) {
			var amount = 0;
			var customerDepositSearch = search.create({
				type: search.Type.CUSTOMER_DEPOSIT,
				columns: ['amount'],
				filters: [
					['mainline', 'is', 'T'],
					'and', ['custbody_om_applyguino', 'is', guiNo]
				]
			});
			customerDepositSearch.run().each(function (result) {
				var amountpaid = result.getValue({
					name: 'amount'
				});
				amount += parseInt(amountpaid);
				return true;
			});
			return amount;
		}

		function getCustomerInformation(customerInternalId) {
			var customerSearch = search.create({
				type: search.Type.CUSTOMER,
				columns: ['entityid',
					'address',
					'altname'],
				filters: [
					['internalid', 'is', customerInternalId]
				]
			});
			var resultObj = {};
			customerSearch.run().each(function (result) {
				var entityid = result.getValue({
					name: 'entityid'
				});
				var address = result.getValue({
					name: 'address'
				});
				var altname = result.getValue({
					name: 'altname'
				});
				resultObj = {
					entityid: entityid,
					address: address,
					altname: altname
				}
				return false;
			});
			return resultObj;
		}

		function getContactInformation(customerInternalId, resultObj) {
			var customerSearch = search.create({
				type: search.Type.CUSTOMER,
				columns: ['contact.entityid',
					'contact.phone',
					'contact.fax',
					'contact.email'],
				filters: [
					['internalid', 'is', customerInternalId],
					'and', ['contact.category', 'is', 1]
				]
			});
			customerSearch.run().each(function (result) {
				var contactEntityId = result.getValue({
					name: 'entityid',
					join: 'contact'
				});
				var phone = result.getValue({
					name: 'phone',
					join: 'contact'
				});
				var fax = result.getValue({
					name: 'fax',
					join: 'contact'
				});
				var email = result.getValue({
					name: 'email',
					join: 'contact'
				});
				resultObj['contactEntityId'] = contactEntityId;
				resultObj['phone'] = phone;
				resultObj['fax'] = fax;
				resultObj['email'] = email;
				return false;
			});
		}

		function getSalesOrder(itemid, sDate, eDate) {
			try {
				var resultObj = {};
				var tranid = '', trandate = '', amount = '', quantity = '', currency = '', exchangerate = '';
				var department = '', salesrep = '', rate = '';
				var POSearch = search.create({
					type: "salesorder",
					columns: [
						search.createColumn({
							name: "trandate",
							sort: search.Sort.DESC,
							label: "Date"
						}),
						search.createColumn({ name: "tranid", label: "Document Number" }),
						search.createColumn({ name: "amount", label: "Amount" }),
						search.createColumn({ name: "currency", label: "Currency" }),
						search.createColumn({ name: "exchangerate", label: "exchangerate" }),
						search.createColumn({ name: "quantity", label: "Quantity" }),
						search.createColumn({ name: "rate", label: "Item Rate" }),
						search.createColumn({ name: "department", label: "DEPARTMENT" }),
						search.createColumn({ name: "salesrep", label: "SALES REP" })
					],
					filters: [
						["mainline", "any", ""],
						"AND", ["trandate", "within", sDate, eDate],
						"AND", ['item', 'anyof', itemid],
						"AND", ["type", "anyof", "SalesOrd"]
					]
				});
				POSearch.run().each(function (result) {
					tranid = result.getValue({ name: 'tranid' });
					trandate = result.getValue({ name: 'trandate' });
					amount = result.getValue({ name: 'amount' });
					currency = result.getText({ name: 'currency' });
					exchangerate = result.getValue({ name: 'exchangerate' });
					quantity = result.getValue({ name: 'quantity' });
					rate = result.getValue({ name: 'rate' });
					department = result.getText({ name: 'department' });
					salesrep = result.getText({ name: 'salesrep' });
				});

				var departArray = department.split(':');

				resultObj['tranid'] = tranid;
				resultObj['trandate'] = trandate;
				resultObj['amount'] = amount;
				resultObj['currency'] = currency;
				resultObj['exchangerate'] = exchangerate;
				resultObj['quantity'] = quantity;
				resultObj['rate'] = rate;
				resultObj['department'] = departArray[departArray.length - 1];
				resultObj['salesrep'] = salesrep;
				return resultObj;
			} catch (error) {
				log.error("getSalesOrder" + error.name, error.message);
			}
		}
		//#endregion

		return {
			getInputData: getInputData,
			map: map,
			reduce: reduce,
			summarize: summarize
		};
	});
