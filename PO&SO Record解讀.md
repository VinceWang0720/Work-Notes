# ScheduledScript架構

```JavaScript
/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */

define([], function () {

  function execute(context) {
    // 執行腳本的內容
  }

  return {
    execute: execute
  };

});

```
- 在ScheduledScript中，一定要有execute method，該method是定時運行主要的方法，結尾以須回傳該method
- line 86~114：
    - 判斷poid裡面是否有值，有的話則針對PO做事
    - 判斷soid裡面是否有值，有的話則針對SO做事