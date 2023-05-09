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
            var request = context.request;
			var defaultPaymentDate = request.parameters.paymentdate;
			var defaultAccount = request.parameters.account;
			var defaultPaymentMethod = request.parameters.paymentmethod;
			var defaultCurrency = request.parameters.currency;
			var defaultEntityType = request.parameters.entitytype;
			var defaultPayAlone = request.parameters.payalone;

            log.debug('defaultPaymentDate',defaultPaymentDate);
            log.debug('defaultAccount',defaultAccount);
			log.debug('defaultCurrency',defaultCurrency);
			log.debug('defaultEntityType',defaultEntityType);
			log.debug('defaultPaymentMethod',defaultPaymentMethod);
			log.debug('defaultPayAlone',defaultPayAlone);

            var mrTask = task.creat({
                taskType: task.TaskType.MAP_REDUCE
            });

            mrTask.scriptId = '';
            mrTask.deploymentId = '';
            mrTask.paras = {
                '':defaultPaymentDate
            };

            var mrTaskId = mrTask.submit();
            context.response.write('<html><body><script>var t = confirm("批次付款Summary Report已列印");  window.history.back();</script></body></html>');
        }
    }

    function createForm(){}

    return {
		onRequest: onRequest
	};

});