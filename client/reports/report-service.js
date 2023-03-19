import { BaseService } from "../js/base-service.js";

export class ReportService extends BaseService {
  getExecutiveSummaryReport(dateAsOf) {
    let options = {
      //select: "[Active]=true",
      //ListType:"Detail",
      DateTo: '"' + dateAsOf + '"',
    };
    return this.getList(this.ERPObjects.BalanceSheetReport, options);
  }

  getBalanceSheetReport(dateAsOf) {
    let options = {
      //select: "[Active]=true",
      //ListType:"Detail",
      DateTo: '"' + dateAsOf + '"',
    };
    return this.getList(this.ERPObjects.BalanceSheetReport, options);
  }

  getProfitLossReport() {
    let options = {
      select: "[Active]=true",
      ListType: "Detail",
      //DateTo:dateAsOf
    };
    return this.getList(this.ERPObjects.ProfitLossReport, options);
  }
  getBalanceSheet() {
    let options = {
      select: "[Active]=true",
      ListType: "Detail",
    };
    return this.getList(this.ERPObjects.BalanceSheetReport, options);
  }

  /*
   * get the contacts
   * */

  getContacts() {
    let options = {
      PropertyList:
        "ID,ClientID,ClientName,Company,CurrencySymbol,ContactAddress,ContactEmail,Active",
      select: "[Active]=true",
    };
    return this.getList(this.ERPObjects.TContact, options);
  }
  getBalanceSheetData() {
    return this.getList(this.ERPObjects.BalanceSheetReport);
  }

  getBalanceSheetRedirectData() {
    let options = {
      ReportType: "Detail",
      IgnoreSummarised: true,
      LimitCount: '"25"',
    };
    // return this.getList(this.ERPObjects.TAccount,options);
    return this.getList(this.ERPObjects.TAccountRunningBalanceReport, options);
  }

  getBalanceSheetRedirectRangeData(datefrom, dateto, limitcount, limitfrom) {
    let options = {
      ReportType: "Detail",
      IgnoreSummarised: true,
      IgnoreDates: false,
      DateTo: '"' + dateto + '"',
      DateFrom: '"' + datefrom + '"',
      LimitCount: '"' + limitcount + '"',
      LimitFrom: '"' + limitfrom + '"',
    };
    // return this.getList(this.ERPObjects.TAccount,options);
    return this.getList(this.ERPObjects.TAccountRunningBalanceReport, options);
  }

  getBalanceSheetRedirectClientData(accountName, limitcount, limitfrom,urlParametersDateFrom,urlParametersDateTo) {
      let options = '';
      if(urlParametersDateFrom != '' && urlParametersDateTo != ''){
        options = {
         ReportType: "Detail",
         IgnoreSummarised: true,
         AccountName:'"'+accountName+'"',
         OrderBy:"Date desc",
         DateFrom: '"' + urlParametersDateFrom + '"',
         DateTo: '"' + urlParametersDateTo + '"',
         LimitCount: '"' + limitcount + '"',
         LimitFrom: '"' + limitfrom + '"',
       };
      }else{
     options = {
      ReportType: "Detail",
      IgnoreSummarised: true,
      IgnoreDates: true,
      AccountName:'"'+accountName+'"',
      OrderBy:"clientname desc",
      LimitCount: '"' + limitcount + '"',
      LimitFrom: '"' + limitfrom + '"',
    };
  }
    // return this.getList(this.ERPObjects.TAccount,options);
    return this.getList(this.ERPObjects.TAccountRunningBalanceReport, options);
  }

  getGSTReconciliationData(dateFrom, dateTo) {
    let options = {
      ReportType: "Detail",
      DateTo: '"' + moment(dateTo).format("YYYY-MM-DD") + '"',
      DateFrom: '"' + moment(dateFrom).format("YYYY-MM-DD") + '"',
    };
    return this.getList(this.ERPObjects.TTaxSummaryReport, options);
  }
  getOneIncomeTransactionData(id) {
    return this.getOneById(this.ERPObjects.TCustomerPayment, id);
  }

  getOneExpenseTransactionData(id) {
    return this.getOneById(this.ERPObjects.TSupplierPayment, id);
  }

  ProfitLossData() {
    return this.getOneById(this.ERPObjects.ProfitLossReport);
  }

  getAccountSummaryRedirectData() {
    let options = {
      ListType: "Detail",
    };
    return this.getList(this.ERPObjects.TAccount, options);
  }

  getProfitandLoss(dateFrom, dateTo, ignoreDate, departments) {
    let options = "";
    if (ignoreDate == true) {
      options = {
        IgnoreDates: true,
      };
    } else if( departments != "" ) {
      options = {
        AllDepartments: false,
        IgnoreDates: false,
        DateFrom: '"' + dateFrom + '"',
        DateTo: '"' + dateTo + '"',
        SelectedDepartments: '"' + departments + '"',
      };
    }else{
      options = {
        IgnoreDates: false,
        DateFrom: '"' + dateFrom + '"',
        DateTo: '"' + dateTo + '"'
      };
    }
    return this.getList(this.ERPObjects.ProfitLossReport, options);
  }

  getProfitandLossCompare(dateFrom, dateTo, ignoreDate, periodType) {
    let options = "";
    if (ignoreDate == true) {
      options = {
        IgnoreDates: true,
        PeriodType: '"' + periodType + '"',
      };
    } else {
      options = {
        IgnoreDates: false,
        DateFrom: '"' + dateFrom + '"',
        DateTo: '"' + dateTo + '"',
        PeriodType: '"' + periodType + '"',
      };
    }

    return this.getList(
      this.ERPObjects.TProfitAndLossPeriodCompareReport,
      options
    );
  }

  getPayHistory(dateFrom, dateTo, ignoreDate, periodType) {
    let options = "";
    if (ignoreDate == true) {
      options = {
        IgnoreDates: true,
        PeriodType: '"' + periodType + '"',
        ListType: "'Detail'",
      };
    } else {
      options = {
        IgnoreDates: false,
        DateFrom: '"' + dateFrom + '"',
        DateTo: '"' + dateTo + '"',
        PeriodType: '"' + periodType + '"',
        ListType: "'Detail'",
      };
    }

    return this.getList(
      this.ERPObjects.TPayHistory,
      options
    );
  }

  getTimeSheetEntry(dateFrom, dateTo, ignoreDate, periodType) {
    let options = "";
    if (ignoreDate == true) {
      options = {
        IgnoreDates: true,
        PeriodType: '"' + periodType + '"',
        ListType: "'Detail'",
      };
    } else {
      options = {
        IgnoreDates: false,
        DateFrom: '"' + dateFrom + '"',
        DateTo: '"' + dateTo + '"',
        PeriodType: '"' + periodType + '"',
        ListType: "'Detail'",
      };
    }

    return this.getList(
      this.ERPObjects.TTimeSheetEntry,
      options
    );
  }

  getDepartment() {
    let options = {
      PropertyList: "DeptClassName",
      select: "[Active]=true",
    };
    return this.getList(this.ERPObjects.TDeptClass, options);
  }

  getProfitLossLayout() {
    let options = {
      LayoutToUse: "'3'"
    };
    return this.getList('TProfitLossLayout', options);
  }

  getAgedPayableDetailsData(dateFrom, dateTo, ignoreDate) {
    let options = "";
    if (ignoreDate == true) {
      options = {
        IgnoreDates: true,
      };
    } else {
      options = {
        IgnoreDates: false,
        DateFrom: '"' + dateFrom + '"',
        DateTo: '"' + dateTo + '"',
      };
    }
    return this.getList(this.ERPObjects.TAPReport, options);
  }

  getAgedPayableDetailsSummaryData(dateFrom, dateTo, ignoreDate,contactID) {
    let options = "";
    if(contactID != ''){
      options = {
        IgnoreDates: true,
        ReportType: "Summary",
        ClientID:contactID
      };
    }else{

    if (ignoreDate == true) {
      options = {
        IgnoreDates: true,
        ReportType: "Summary",
      };
    } else {
      options = {
        IgnoreDates: false,
        ReportType: "Summary",
        DateFrom: '"' + dateFrom + '"',
        DateTo: '"' + dateTo + '"',
      };
    }
  }
    return this.getList(this.ERPObjects.TAPReport, options);
  }

  getAgedReceivableDetailsData(dateFrom, dateTo, ignoreDate, contactID) {
    let options = "";
    if(contactID != ''){
      options = {
        IgnoreDates: true,
        ClientID:contactID
      };
    }else{
    if (ignoreDate == true) {
      options = {
        IgnoreDates: true
      };
    } else {
      options = {
        IgnoreDates: false,
        DateFrom: '"' + dateFrom + '"',
        DateTo: '"' + dateTo + '"',
      };
    }
  }
    return this.getList(this.ERPObjects.TARReport, options);
  }


  getTAPReport(dateFrom, dateTo, ignoreDate, contactID) {
    let options = "";
    if(contactID != ''){
      options = {
        IgnoreDates: true,
        ClientID:contactID
      };
    }else{
    if (ignoreDate == true) {
      options = {
        IgnoreDates: true
      };
    } else {
      options = {
        IgnoreDates: false,
        DateFrom: '"' + dateFrom + '"',
        DateTo: '"' + dateTo + '"',
      };
    }
  }
    return this.getList(this.ERPObjects.TAPReport, options);
  }

  getAgedReceivableDetailsSummaryData(dateFrom, dateTo, ignoreDate, contactID) {
    let options = "";
    if(contactID != ''){
      options = {
        IgnoreDates: true,
        ReportType: "Summary",
        ClientID:contactID,
        IncludeRefunds:false
      };
    }else{
    if (ignoreDate == true) {
      options = {
        IgnoreDates: true,
        ReportType: "Summary",
        IncludeRefunds:false
      };
    } else {
      options = {
        IgnoreDates: false,
        ReportType: "Summary",
        DateFrom: '"' + dateFrom + '"',
        DateTo: '"' + dateTo + '"',
        IncludeRefunds:false
      };
    }
    }
    return this.getList(this.ERPObjects.TARReport, options);
  }

  getGeneralLedgerDetailsData(dateFrom, dateTo, ignoreDate) {
    let options = "";
    if (ignoreDate == true) {
      options = {
        IgnoreDates: true,
      };
    } else {
      options = {
        IgnoreDates: false,
        DateFrom: '"' + dateFrom + '"',
        DateTo: '"' + dateTo + '"',
      };
    }
    return this.getList(this.ERPObjects.TGeneralLedgerReport, options);
  }

  getTrialBalanceDetailsData(dateFrom, dateTo, ignoreDate) {
    let options = "";
    if (ignoreDate == true) {
      options = {
        IgnoreDates: true,
      };
    } else {
      options = {
        IgnoreDates: false,
        DateFrom: '"' + dateFrom + '"',
        DateTo: '"' + dateTo + '"',
      };
    }
    return this.getList(this.ERPObjects.TTrialBalanceReport, options);
  }

  getPurchasesDetailsData(dateFrom, dateTo, ignoreDate) {
    let options = "";
    if (ignoreDate == true) {
      options = {
        IgnoreDates: true,
        IncludePOs: true,
      };
    } else {
      options = {
        IgnoreDates: false,
        IncludePOs: true,
        DateFrom: '"' + dateFrom + '"',
        DateTo: '"' + dateTo + '"',
      };
    }

    return this.getList(this.ERPObjects.TbillReport, options);
  }

  getPurchaseSummaryDetailsData(dateFrom, dateTo, ignoreDate) {
    let options = "";
    if (ignoreDate == true) {
      options = {
        IgnoreDates: true,
        IncludePOs: true,
        ReportType: "Summary",
      };
    } else {
      options = {
        IgnoreDates: false,
        IncludePOs: true,
        ReportType: "Summary",
        DateFrom: '"' + dateFrom + '"',
        DateTo: '"' + dateTo + '"',
      };
    }

    return this.getList(this.ERPObjects.TbillReport, options);
  }

  getSalesDetailsData(dateFrom, dateTo, ignoreDate) {
    let options = "";
    if (ignoreDate == true) {
      options = {
        IgnoreDates: true,
      };
    } else {
      options = {
        IgnoreDates: false,
        DateFrom: '"' + dateFrom + '"',
        DateTo: '"' + dateTo + '"',
      };
    }

    return this.getList(this.ERPObjects.TSalesList, options);
  }

  getSalesDetailsSummaryData(dateFrom, dateTo, ignoreDate) {
    let options = "";
    if (ignoreDate == true) {
      options = {
        IgnoreDates: true,
        ListType: "Summary",
      };
    } else {
      options = {
        IgnoreDates: false,
        ListType: "Summary",
        DateFrom: '"' + dateFrom + '"',
        DateTo: '"' + dateTo + '"',
      };
    }

    return this.getList(this.ERPObjects.TSalesList, options);
  }

  getProductSalesDetailsData(dateFrom, dateTo, ignoreDate) {
    let options = "";
    if (ignoreDate == true) {
      options = {
        IgnoreDates: true,
      };
    } else {
      options = {
        IgnoreDates: false,
        DateFrom: '"' + dateFrom + '"',
        DateTo: '"' + dateTo + '"',
      };
    }

    return this.getList(this.ERPObjects.TProductSalesDetailsReport, options);
  }

  getTaxSummaryData(dateFrom, dateTo, ignoreDate) {
    let options = "";
    if (ignoreDate == true) {
      options = {
        IgnoreDates: true,
        ReportType: "Summary",
      };
    } else {
      options = {
        IgnoreDates: false,
        ReportType: "Summary",
        DateFrom: '"' + dateFrom + '"',
        DateTo: '"' + dateTo + '"',
      };
    }
    return this.getList(this.ERPObjects.TTaxSummaryReport, options);
  }

  getAllProductSalesDetails(dateFrom, dateTo, ignoreDate) {
    let options = "";
    if (ignoreDate == true) {
      options = {
        IgnoreDates: true,
      };
    } else {
      options = {
        IgnoreDates: false,
        DateFrom: '"' + dateFrom + '"',
        DateTo: '"' + dateTo + '"',
      };
    }
    return this.getList(this.ERPObjects.TProductSalesDetailsReport, options);
  }

  getContractorPaymentSummaryData(dateFrom, dateTo, ignoreDate) {
    let options = "";
    if (ignoreDate == true) {
      options = {
        IgnoreDates: true,
      };
    } else {
      options = {
        IgnoreDates: false,
        DateFrom: '"' + dateFrom + '"',
        DateTo: '"' + dateTo + '"',
      };
    }

    return this.getList(this.ERPObjects.TContractorPaymentSummary, options);
  }

  /**
   * This function will return CustomerDetails
   *
   * @param {*} dateFrom
   * @param {*} dateTo
   * @param {*} ignoreDate
   * @returns
   */
  getCustomerDetails(dateFrom, dateTo, ignoreDate = false) {
    let options = "";
    if (ignoreDate == true) {
      options = {
        IgnoreDates: true,
      };
    } else {
      options = {
        IgnoreDates: false,
        DateFrom: '"' + dateFrom + '"',
        DateTo: '"' + dateTo + '"',
      };
    }
    return this.getList(this.ERPObjects.TCustomerPayment, options);
  }

  getleaveAccruals(dateFrom, dateTo, ignoreDate = false) {
    let options = "";
    if (ignoreDate == true) {
      options = {
        IgnoreDates: true,
      };
    } else {
      options = {
        IgnoreDates: false,
        DateFrom: '"' + dateFrom + '"',
        DateTo: '"' + dateTo + '"',
      };
    }
    return this.getList(this.ERPObjects.TleaveAccruals, options);
  }

  getStockQuantityLocationReport(dateFrom, dateTo, ignoreDate = false) {
    let options = "";
    if (ignoreDate == true) {
      options = {
        IgnoreDates: true,
      };
    } else {
      options = {
        IgnoreDates: false,
        DateFrom: '"' + dateFrom + '"',
        DateTo: '"' + dateTo + '"',
      };
    }
    return this.getList(this.ERPObjects.TProductStocknSalePeriodReport, options);
  }

  getStockMovementReport(dateFrom, dateTo, ignoreDate = false) {
    let options = "";
    if (ignoreDate == true) {
      options = {
        IgnoreDates: true,
        ListType: "'Detail'"
      };
    } else {
      options = {
        IgnoreDates: false,
        DateFrom: '"' + dateFrom + '"',
        DateTo: '"' + dateTo + '"',
        ListType: "'Detail'"
      };
    }
    return this.getList(this.ERPObjects.T_VS1_Report_Productmovement, options);
  }

  getSerialNumberReport(dateFrom, dateTo, ignoreDate = false) {
    let options = "";
    if (ignoreDate == true) {
      options = {
        IgnoreDates: true,
        ListType: "'Detail'"
      };
    } else {
      options = {
        IgnoreDates: false,
        DateFrom: '"' + dateFrom + '"',
        DateTo: '"' + dateTo + '"',
        ListType: "'Detail'"
      };
    }
    return this.getList(this.ERPObjects.TSerialNumberListCurrentReport, options);
  }

  getBinLocationReport(dateFrom, dateTo, ignoreDate = false) {
    let options = "";
    if (ignoreDate == true) {
      options = {
        IgnoreDates: true,
        ListType: "'Detail'"
      };
    } else {
      options = {
        IgnoreDates: false,
        DateFrom: '"' + dateFrom + '"',
        DateTo: '"' + dateTo + '"',
        ListType: "'Detail'"
      };
    }
    return this.getList(this.ERPObjects.TProductBin, options);
  }

  getCustomerDetailReport(dateFrom, dateTo, ignoreDate = false) {
    let options = "";
    if (ignoreDate == true) {
      options = {
        IgnoreDates: true,
      };
    } else {
      options = {
        IgnoreDates: false,
        DateFrom: '"' + dateFrom + '"',
        DateTo: '"' + dateTo + '"',
      };
    }
    return this.getList(this.ERPObjects.TCustomerSummaryReport, options);
  }
  
}
