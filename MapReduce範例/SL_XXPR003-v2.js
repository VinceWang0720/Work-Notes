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
	function (ui, search, task) {
	var _feeTable = [];

	/**
	 * Definition of the Suitelet script trigger point.
	 *
	 * @param {Object} context
	 * @param {ServerRequest} context.request - Encapsulation of the incoming request
	 * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
	 * @Since 2015.2
	 */
	function onRequest(context) {
		var form;
		if (context.request.method === 'GET') {
			form = createForm();
			context.response.writePage(form);
		} else {
			var request = context.request;
			var defaultPaymentDate = request.parameters.paymentdate;
			var defaultAccount = request.parameters.account;
			var defaultPaymentMethod = request.parameters.paymentmethod;
			var defaultCurrency = request.parameters.currency;
			var defaultEntityType = request.parameters.entitytype;
			var defaultPayAlone = request.parameters.payalone;
			//form = createForm(defaultPaymentDate, defaultAccount, defaultPaymentMethod, defaultCurrency, defaultEntityType, defaultPayAlone);

			var mrTask = task.create({
					taskType: task.TaskType.MAP_REDUCE
				});
				
			log.debug('defaultPaymentDate',defaultPaymentDate);
						log.debug('defaultAccount',defaultAccount);
			log.debug('defaultCurrency',defaultCurrency);
			log.debug('defaultEntityType',defaultEntityType);
			log.debug('defaultPaymentMethod',defaultPaymentMethod);
			log.debug('defaultPayAlone',defaultPayAlone);

			mrTask.scriptId = 'customscript_mr_xxpr003_v2';
			mrTask.deploymentId = 'customdeploy_mr_xxpr003_v2';
			mrTask.params = {
				'custscript_xxpr003_paymentdate_v2': defaultPaymentDate,
				'custscript_xxpr003_account_v2': defaultAccount,
				'custscript_xxpr003_currency_v2': defaultCurrency,
				'custscript_xxpr003_type_v2': defaultEntityType,
				'custscript_xxpr003_method_v2': defaultPaymentMethod,
				'custscript_xxpr003_payalone_v2': defaultPayAlone
			};
			var mrTaskId = mrTask.submit();
			context.response.write('<html><body><script>var t = confirm("批次付款Summary Report已列印");  window.history.back();</script></body></html>');

		}
		// form.addButton({
		// id: 'excel',
		// label: '產生Excel',
		// functionName: 'exportExcel'
		// });
		// context.response.writePage(form);
	}

	function createForm(defaultPaymentDate, defaultAccount, defaultPaymentMethod, defaultCurrency, defaultEntityType, defaultPayAlone) {
		defaultPaymentDate = defaultPaymentDate || '';
		defaultAccount = defaultAccount || '';
		defaultEntityType = defaultEntityType || '';
		defaultPaymentMethod = defaultPaymentMethod || '2';
		defaultCurrency = defaultCurrency || '';
		defaultPayAlone = defaultPayAlone || '';

		var form = ui.createForm({
				title: '批次付款Summary Report V2'
			});

		form.addSubmitButton({
			id: 'excel',
			label: '產生Excel'
		});

		var paymentdate = form.addField({
				id: 'paymentdate',
				type: ui.FieldType.DATE,
				label: 'Date'
			});
		paymentdate.isMandatory = true;
		paymentdate.defaultValue = defaultPaymentDate;

		var account = form.addField({
				id: 'account',
				type: ui.FieldType.SELECT,
				label: 'Account',
				source: 'Account'
			});
		account.isMandatory = true;
		account.defaultValue = defaultAccount;

		var currency = form.addField({
				id: 'currency',
				type: ui.FieldType.SELECT,
				label: 'Currency',
				source: 'Currency'
			});
		currency.isMandatory = true;
		currency.defaultValue = defaultCurrency;

		var entityType = form.addField({
				id: 'entitytype',
				type: ui.FieldType.SELECT,
				label: 'Entity Type'
			});

		entityType.addSelectOption({
			value: '1',
			text: 'Vendor'
		});
		
		entityType.addSelectOption({
			value: '3',
			text: 'Employee'
		});
		

		entityType.isMandatory = true;
		entityType.defaultValue = defaultEntityType;

		var paymentMethod = form.addField({
				id: 'paymentmethod',
				type: ui.FieldType.SELECT,
				label: 'Payment Method',
				source: 'customlistast_payment_method'
			});
		paymentMethod.isMandatory = true;
		paymentMethod.defaultValue = defaultPaymentMethod;

		var payAlone = form.addField({
				id: 'payalone',
				type: ui.FieldType.SELECT,
				label: 'Pay Each Document Alone'
			});

		
		payAlone.addSelectOption({
			value: '2',
			text: 'No'
		});
		
		payAlone.addSelectOption({
			value: '1',
			text: 'Yes'
		});

		payAlone.isMandatory = true;
		payAlone.defaultValue = defaultPayAlone;

		return form;
	}

	return {
		onRequest: onRequest
	};

});
