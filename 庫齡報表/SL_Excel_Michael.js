/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/file', 'N/encode', 'N/record', 'N/format', 'N/config', 'N/search'],
	
	function(file, encode, record, format, config, search) {
		
		var br = "&#10;";

		function onRequest(context)
		{
			var request = context.request;
			var response = context.response;
			
			var companyInfo = config.load({
				type: config.Type.COMPANY_INFORMATION
			});
			
			var companyName = companyInfo.getValue({fieldId: 'companyname'});
			var addr1 = companyInfo.getValue({fieldId: 'mainaddress_text'}).replace("<br>","");
			
			var so_id = request.parameters.so_id;
			var soRec = record.load({
				type: record.Type.SALES_ORDER,
				id: so_id 
			});
			
			if (context.request.method == 'GET') {
				
				var tranid = soRec.getValue({fieldId: 'tranid'});
				var trandate = soRec.getValue({fieldId: 'trandate'});
				var formatted_trandate = "";
				if( trandate != "" )
				{
					formatted_trandate = format.format({
						value: trandate,
						type: format.Type.DATE
					});
				}				
				var xmlStr = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
				xmlStr += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
				xmlStr += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
				xmlStr += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
				xmlStr += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
				xmlStr += 'xmlns:html="http://www.w3.org/TR/REC-html40">';

				xmlStr += '<Styles>'
				        // + '<Style ss:ID="s0">' //標題置中
							// + '<Alignment ss:Horizontal="Center"/>'
							// + '<Font ss:Size="26" ss:Color="#000000" ss:Bold="1"/>'
						// + '</Style>' 
						// + '<Style ss:ID="s0_1">' //地址置中
							// + '<Alignment ss:Horizontal="Center"/>'
							// + '<Font ss:Size="9.5" ss:Color="#00803A" ss:Bold="1"/>'
						// + '</Style>' 
						// + '<Style ss:ID="s1">' //CONTRACT NO.
							// + '<Alignment ss:Horizontal="Center"/>'
							// + '<Font x:CharSet="204" ss:Size="12" ss:Color="#000000" ss:Bold="1" ss:Underline="Single"/>'
						// + '</Style>' 
						+ '<Style ss:ID="po">' //PURCHASE ORDER置中
							+ '<Alignment ss:Horizontal="Center"/>'
							+ '<Font ss:Size="26" ss:Color="#000000" ss:Bold="1"/>'
						+ '</Style>' 
						+ '<Style ss:ID="company_name">' //[company_name]粗體黑字
							+ '<Font ss:Size="26" ss:Color="#000000" ss:Bold="1"/>'
						+ '</Style>' 
						+ '<Style ss:ID="addr">' //[address]黑字
							// + '<Font ss:Size="12" ss:Color="#000000" ss:WrapText="1"/>'
							+ '<Alignment ss:Vertical="Top" ss:WrapText="1"/>'
							+ '<Font ss:Size="12" ss:Color="#000000" />' //20190213
						+ '</Style>' 
						+ '<Style ss:ID="page_header">' //粗體黑底白字
						    + '<Alignment ss:Horizontal="Center"/>'
							+ '<Interior ss:Color="#000000" ss:Pattern="Solid"/>'
							+ '<Font ss:Size="14" ss:Color="#ffffff" ss:Bold="1"/>'
						+ '</Style>' 
						+ '<Style ss:ID="line_header">' //粗體黑字
							+ '<Font ss:Size="12" ss:Color="#000000" ss:Bold="1"/>'
						+ '</Style>' 
						+ '<Style ss:ID="remark_header">' //粗體灰底黑字
							// + '<Interior ss:Color="#A6A6A6" ss:Pattern="Solid"/>'
							+ '<Font ss:Size="14" ss:Color="#000000" ss:Bold="1"/>'
						+ '</Style>' 
						+ '<Style ss:ID="shipping">' //粗體灰底黑字(大)
							+ '<Interior ss:Color="#A6A6A6" ss:Pattern="Solid"/>'
							+ '<Font ss:Size="24" ss:Color="#000000" ss:Bold="1"/>'
						+ '</Style>' 
						+ '<Style ss:ID="statement_1">' //粗體黃底黑字
							+ '<Interior ss:Color="#FFFF00" ss:Pattern="Solid"/>'
							+ '<Font ss:Size="13" ss:Color="#000000" ss:Bold="1"/>'
						+ '</Style>' 
						+ '<Style ss:ID="statement_2">' //黃底紅字
							+ '<Interior ss:Color="#FFFF00" ss:Pattern="Solid"/>'
							+ '<Font ss:Size="13" ss:Color="#FF0000"/>'
						+ '</Style>' 
						+ '<Style ss:ID="s3">' //靠上備註
							+ '<Alignment ss:Vertical="Top" ss:WrapText="1"/>'
						+ '</Style>' 
						+ '<Style ss:ID="s_warning">' //warning
							+ '<Font x:CharSet="204" ss:Color="#ff0000" ss:Underline="Single"/>'
						+ '</Style>' 
						+ '</Styles>';

				xmlStr += '<Worksheet ss:Name="Sheet1">';
				xmlStr += '<Table ss:DefaultColumnWidth="60">'
						+ '<Row>'
						+ '<Cell ss:StyleID="company_name" ss:MergeAcross="6"><Data ss:Type="String"> '+companyName+'</Data></Cell>'
						+ blankCell(10)
						+ '<Cell><Data ss:Type="String">DATE : </Data></Cell>'
						+ '<Cell ss:MergeAcross="2"><Data ss:Type="String">'+formatted_trandate+'</Data></Cell>'
						+ '</Row>';

				/* 開始組裝XML */
				
				xmlStr += '<Row>'
							+ '<Cell><Data ss:Type="String">Cc Duplicate:</Data></Cell>'
							+ blankCell(6)
							+ '<Cell><Data ss:Type="String">Confirmed By:</Data></Cell>'
							+ blankCell(6)
							+ '<Cell><Data ss:Type="String">Yours faithfully,</Data></Cell>'
						+ '</Row>';
						
				xmlStr += '</Table></Worksheet></Workbook>';

				var strXmlEncoded = encode.convert({
					string : xmlStr,
					inputEncoding : encode.Encoding.UTF_8,
					outputEncoding : encode.Encoding.BASE_64
				});

				var objXlsFile = file.create({
					name : 'salesorder_123.xls',
					fileType : file.Type.EXCEL,
					contents : strXmlEncoded
				});
				
				context.response.writeFile({
					file : objXlsFile
				});
			}

		}
		
		//四捨五入小數後precision位
		//comma:是否加comma
		function round(value,precision,comma)
		{
			var multiplier = Math.pow(10, precision || 0);
			var roundNumber = ( Math.round(value * multiplier) / multiplier ).toFixed(precision);
			
			if( comma )
			{
				var parts = roundNumber.toString().split(".");
				parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
				roundNumber = parts.join(".");
			}
			return roundNumber;
		}
		
		function linebreak(str)
		{
			return str.replace("\r", "&#013;").replace("\n", "&#010;");
			// log.debug(str.replace(/[r]/g, "換行"));
			// return str.replace(/[r]/g, br);
		}
		
		function blankCell(c)
		{
			var cellStr = "";
			for(var i=1 ; i<=c ; i++ )
			{
				cellStr += '<Cell></Cell>';
			}
			return cellStr;
		}
		
		return {
			onRequest : onRequest
		};

});
