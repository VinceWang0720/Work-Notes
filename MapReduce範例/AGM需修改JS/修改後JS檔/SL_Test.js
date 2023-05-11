/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */

define(['N/ui/serverWidget', 'N/search', 'N/task'],
	/**
	 * @param {serverWidget} serverWidget
	 * @param {search} search
	 */ 
function(ui, search, task) {
    /**
	 * Definition of the Suitelet script trigger point.
	 *
	 * @param {Object} context
	 * @param {ServerRequest} context.request - Encapsulation of the incoming request
	 * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
	 * @Since 2023.5
	 */

    function onRequest(context){
        if(context.request.method === 'GET'){
            form = createForm();
			context.response.writePage(form);
        }else{
            // after press button 
			//接前頁參數
			//一般媒體申報_條件內容
			var rgd01  = req.parameters.custpage_gd01;  //稅籍編號
			var rgd02  = req.parameters.custpage_gd02;  //申報範圍:1進項,2銷項,3進銷項
			var rgd03  = req.parameters.custpage_gd03;  //申報年度
			var rgd04  = req.parameters.custpage_gd04;  //申報月份_起
			var rgd05  = req.parameters.custpage_gd05;  //申報月份_迄

			log.debug('rgd01',rgd01);
			log.debug('rgd02',rgd02);
			log.debug('rgd03',rgd03);
			log.debug('rgd04',rgd04);
			log.debug('rgd05',rgd05);

			

            var mrTask = task.creat({
                taskType: task.TaskType.MAP_REDUCE
            });

            mrTask.scriptId = '';
            mrTask.deploymentId = '';
            mrTask.paras = {
                'rgd01':rgd01,
				'rgd02':rgd02,
				'rgd03':rgd03,
				'rgd04':rgd04,
				'rgd01':rgd01,
            };

            var mrTaskId = mrTask.submit();
            context.response.write('<html><body><script>var t = confirm("批次付款Summary Report已列印");  window.history.back();</script></body></html>');
        }
    }

    function createForm(){}

	//字串空白或補0處理 /總長度,字串長度,傳入字串,補字元
	function txtStringPrcess(thisLength,strLength,thisStr,addtype){
		var addStr = '';
		for (var j=strLength; j<thisLength; j++) {
				addStr = addStr + addtype;
		}
		thisStr = addStr + thisStr; //補字元於左處
		return thisStr;
	} 
	//--------------------------------------------------
	
    return {
		onRequest: onRequest
	};

});