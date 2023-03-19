import { ReportService } from "../report-service";
import { SalesBoardService } from "../../js/sales-service";
import "jQuery.print/jQuery.print.js";
import { UtilityService } from "../../utility-service";
import GlobalFunctions from "../../GlobalFunctions";
import LoadingOverlay from "../../LoadingOverlay";
import { TaxRateService } from "../../settings/settings-service";

let defaultCurrencyCode = CountryAbbr; // global variable "AUD"

let reportService = new ReportService();
let utilityService = new UtilityService();
let taxRateService = new TaxRateService();

Template.balancesheetreport.onCreated(function () {
  const templateObject = Template.instance();
  templateObject.selected = new ReactiveVar();
  templateObject.records = new ReactiveVar();
  templateObject.netAssetTotal = new ReactiveVar();
  templateObject.dateAsAtAYear = new ReactiveVar();
  templateObject.dateAsAt = new ReactiveVar();
  templateObject.currentYear = new ReactiveVar();
  templateObject.nextYear = new ReactiveVar();
  templateObject.currentMonth = new ReactiveVar();
  templateObject.currencyRecord = new ReactiveVar([]);
  templateObject.tabinationRecord = new ReactiveVar([]);

  templateObject.currencyList = new ReactiveVar([]);
  templateObject.activeCurrencyList = new ReactiveVar([]);
  templateObject.tcurrencyratehistory = new ReactiveVar([]);
});

Template.balancesheetreport.onRendered(() => {
  const templateObject = Template.instance();
  LoadingOverlay.show();

  let taxRateService = new TaxRateService();

  let salesService = new SalesBoardService();

  templateObject.$("#more_search").hide();
  let initCurrency = Currency;

  $(document).ready(function () {
    $("#date-input,#dtSODate,#balancedate").datepicker({
      showOn: "button",
      buttonText: "Show Date",
      buttonImageOnly: true,
      buttonImage: "/img/imgCal2.png",
      dateFormat: "dd/mm/yy",
      // dateFormat: 'yy-mm-dd',
      showOtherMonths: true,
      selectOtherMonths: true,
      changeMonth: true,
      changeYear: true,
      yearRange: "-90:+10",
      onChangeMonthYear: function (year, month, inst) {
        // Set date to picker
        $(this).datepicker(
          "setDate",
          new Date(year, inst.selectedMonth, inst.selectedDay)
        );
        // Hide (close) the picker
        // $(this).datepicker('hide');
        // // Change ttrigger the on change function
        // $(this).trigger('change');
      },
    });

    let imageData = localStorage.getItem("Image");
    if (imageData) {
      $("#uploadedImage").attr("src", imageData);
      $("#uploadedImage").attr("width", "50%");
    }

    var today = moment().format("DD/MM/YYYY");
    var currentDate = new Date();
    var begunDate = moment(currentDate).format("DD/MM/YYYY");
    templateObject.dateAsAt.set(begunDate);
  });

  let date = new Date();
  //balance date dropdown
  templateObject.currentYear.set(date.getFullYear());
  templateObject.nextYear.set(date.getFullYear() + 1);
  let currentMonth = moment(date).format("DD/MM/YYYY");
  templateObject.currentMonth.set(currentMonth);

  if (localStorage.getItem("balanceSheetItemStore")) {
    $("#wrapper_main ul.nav").addClass("tabination");
    templateObject.tabinationRecord.set(
      JSON.parse(localStorage.getItem("balanceSheetItemStore"))
    );
  } else {
    $("#page-content-wrapper_main ul.nav").removeClass("tabination");
    $(".nav-tabs").hide();
  }

  templateObject.getBalanceSheetReports = async (dateAsOf) => {
    LoadingOverlay.show();

    let data = !localStorage.getItem("VS1BalanceSheet_Report1")
      ? await reportService.getBalanceSheetReport(dateAsOf)
      : JSON.parse(localStorage.getItem("VS1BalanceSheet_Report"));

    let records = [];
    if (data.balancesheetreport) {
      let date = new Date(dateAsOf);
      let previousYear = date.getFullYear() - 1;
      let Balancedatedisplay = moment(dateAsOf).format("DD/MM/YYYY");
      let lastdatemonthdisplay =
        moment(dateAsOf).format("DD MMM") + " " + previousYear;
      templateObject.dateAsAtAYear.set(lastdatemonthdisplay);
      templateObject.dateAsAt.set(Balancedatedisplay);
      setTimeout(function () {
        $("#balanceData tbody tr:first td .SubHeading").html(
          "As at " + moment(dateAsOf).format("DD/MM/YYYY")
        );
      }, 0);

      let sort = templateObject.$("#sort").val();
      let flag = false;
      if (sort == "Account Code") {
        flag = true;
      }

      let totalNetAssets = 0;
      let GrandTotalLiability = 0;
      let GrandTotalAsset = 0;
      for (let i = 0, len = data.balancesheetreport.length; i < len; i++) {
        let recordObj = {};
        recordObj.id = data.balancesheetreport[i].ID;
        recordObj.name = $.trim(data.balancesheetreport[i]["Account Tree"])
          .split(" ")
          .join("_");

        let SubAccountTotal = data.balancesheetreport[i]["Sub Account Total"];
        if (SubAccountTotal !== 0) {
          SubAccountTotal = utilityService.modifynegativeCurrencyFormat(SubAccountTotal);
        } else {
          SubAccountTotal = " ";
        }

        let HeaderAccountTotal = data.balancesheetreport[i]["Header Account Total"];
        if (HeaderAccountTotal !== 0) {
            HeaderAccountTotal = utilityService.modifynegativeCurrencyFormat(HeaderAccountTotal);
          } else {
              HeaderAccountTotal = " ";
          }

        let TotalCurrentAsset_Liability = data.balancesheetreport[i]["Total Current Asset & Liability"];
        if (TotalCurrentAsset_Liability !== 0) {
          TotalCurrentAsset_Liability = utilityService.modifynegativeCurrencyFormat(TotalCurrentAsset_Liability);
        } else {
          TotalCurrentAsset_Liability = " ";
        }

        let TotalAsset_Liability = data.balancesheetreport[i]["Total Asset & Liability"];
        if (TotalAsset_Liability !== 0) {
          TotalAsset_Liability = utilityService.modifynegativeCurrencyFormat(TotalAsset_Liability);
        } else {
          TotalAsset_Liability = " ";
        }

        let AccountTree = data.balancesheetreport[i]["Account Tree"];
        // if (AccountTree !== 0) {
        //   AccountTree = utilityService.modifynegativeCurrencyFormat(AccountTree);
        // } else {
        //   AccountTree = " ";
        // }
        recordObj.selected = false;

        /**
         * Add a title by default
         */
        // recordObj.title = data.balancesheetreport[i]["Account Tree"] || "-";
        // recordObj.subTotal = SubAccountTotal || "";

        if (
          (i == 0 && AccountTree == "ASSETS") ||
          AccountTree.replace(/\s/g, "") == "LIABILITIES&EQUITY"
        ) {
          recordObj.dataArrHeader = [
            data.balancesheetreport[i]["Account Tree"] || " ",
          ];

          // recordObj.title = data.balancesheetreport[i]["Account Tree"] || " ";
        } else if (i == 1 || i == 2 || AccountTree == "") {
          recordObj.dataArrAsset = [
            data.balancesheetreport[i]["Account Tree"] || " ",
          ];
          // recordObj.title = data.balancesheetreport[i]["Account Tree"] || " ";
        } else if (AccountTree.replace(/\s/g, "") == "TotalChequeorSaving") {
          recordObj.dataArrTotal = [
            data.balancesheetreport[i]["Account Tree"] || "-",
            {
              type: "amount",
              value: SubAccountTotal || "",
              amount:
                utilityService.convertSubstringParseFloat(SubAccountTotal) ||
                "",
            },
            {
              type: "amount",
              value: HeaderAccountTotal || "",
              amount:
                utilityService.convertSubstringParseFloat(HeaderAccountTotal) || "",
            },
          ];

          // recordObj.type = "total";
          // recordObj.title = data.balancesheetreport[i]["Account Tree"] || "-";
          // recordObj.subTotal = SubAccountTotal || "";
          // recordObj.total = utilityService.modifynegativeCurrencyFormat(HeaderAccountTotal) || "";
        } else if (
          AccountTree.replace(/\s/g, "") == "TotalAccountsReceivable"
        ) {
          recordObj.dataArrTotal = [
            data.balancesheetreport[i]["Account Tree"] || "-",
            {
              type: "amount",
              value: SubAccountTotal || "",
              amount:
                utilityService.convertSubstringParseFloat(SubAccountTotal) ||
                "",
            },
            {
              type: "amount",
              value: HeaderAccountTotal || "",
              amount:
                utilityService.convertSubstringParseFloat(HeaderAccountTotal) || "",
            },
            ,
          ];

          // recordObj.type = "total";
          // recordObj.title = data.balancesheetreport[i]["Account Tree"] || "-";
          // recordObj.subTotal = SubAccountTotal || "";
          // recordObj.total = utilityService.modifynegativeCurrencyFormat(HeaderAccountTotal) || "";
        } else if (AccountTree.replace(/\s/g, "") == "TotalOtherCurrentAsset") {
          recordObj.dataArrTotal = [
            data.balancesheetreport[i]["Account Tree"] || "-",
            {
              type: "amount",
              value: SubAccountTotal || "",
              amount:
                utilityService.convertSubstringParseFloat(SubAccountTotal) ||
                "",
            },
            {
              type: "amount",
              value: HeaderAccountTotal || "",
              amount:
                utilityService.convertSubstringParseFloat(HeaderAccountTotal) || "",
            },
          ];

          // recordObj.type = "total";
          // recordObj.title = data.balancesheetreport[i]["Account Tree"] || "-";
          // recordObj.subTotal = SubAccountTotal || "";
          // recordObj.total = utilityService.modifynegativeCurrencyFormat(HeaderAccountTotal) || "";
        } else if (AccountTree.replace(/\s/g, "") == "TotalCurrentAssets") {
          recordObj.dataArrTotal = [
            data.balancesheetreport[i]["Account Tree"] || "-",
            {
              type: "amount",
              value: SubAccountTotal || "",
              amount:
                utilityService.convertSubstringParseFloat(SubAccountTotal) ||
                "",
            },
            {
              type: "amount",
              value: TotalCurrentAsset_Liability || "",
              amount:
                utilityService.convertSubstringParseFloat(TotalCurrentAsset_Liability) || "",
            },
          ];
        } else if (AccountTree.replace(/\s/g, "") == "FixedAsset") {
          recordObj.dataArrAsset = [
            data.balancesheetreport[i]["Account Tree"] || " ",
          ];

          // recordObj.type = "asset";
          // recordObj.title = data.balancesheetreport[i]["Account Tree"] || " ";
        } else if (AccountTree.replace(/\s/g, "") == "TotalFixedAsset") {
          recordObj.dataArrTotal = [
            data.balancesheetreport[i]["Account Tree"] || "-",
            {
              type: "amount",
              value: SubAccountTotal || "",
              amount:
                utilityService.convertSubstringParseFloat(SubAccountTotal) ||
                "",
            },
            {
              type: "amount",
              value: TotalCurrentAsset_Liability || "",
              amount:
                utilityService.convertSubstringParseFloat(TotalCurrentAsset_Liability) || "",
            },
          ];
        } else if (AccountTree.replace(/\s/g, "") == "TOTALASSETS") {
          recordObj.dataArrTotal = [
            data.balancesheetreport[i]["Account Tree"] || "-",
            {
              type: "amount",
              value: SubAccountTotal || "",
              amount:
                utilityService.convertSubstringParseFloat(SubAccountTotal) ||
                "",
            },
            {
              type: "amount",
              value: TotalAsset_Liability || "",
              amount:
                utilityService.convertSubstringParseFloat(TotalAsset_Liability) || "",
            },
          ];

          GrandTotalAsset = TotalAsset_Liability;
        } else if (
          AccountTree.replace(/\s/g, "") == "Liabilities" ||
          AccountTree.replace(/\s/g, "") == "CurrentLiabilities"
        ) {
          recordObj.dataArrAsset = [
            data.balancesheetreport[i]["Account Tree"] || " ",
          ];
        } else if (AccountTree.replace(/\s/g, "") == "TotalCreditCardAccount") {
          recordObj.dataArrTotal = [
            data.balancesheetreport[i]["Account Tree"] || "-",
            {
              type: "amount",
              value: SubAccountTotal || "",
              amount:
                utilityService.convertSubstringParseFloat(SubAccountTotal) ||
                "",
            },
            {
              type: "amount",
              value: HeaderAccountTotal || "",
              amount:
                utilityService.convertSubstringParseFloat(HeaderAccountTotal) || "",
            },
          ];
        } else if (AccountTree.replace(/\s/g, "") == "TotalAccountsPayable") {
          recordObj.dataArrTotal = [
            data.balancesheetreport[i]["Account Tree"] || "-",
            {
              type: "amount",
              value: SubAccountTotal || "",
              amount:
                utilityService.convertSubstringParseFloat(SubAccountTotal) ||
                "",
            },
            {
              type: "amount",
              value: HeaderAccountTotal || "",
              amount:
                utilityService.convertSubstringParseFloat(HeaderAccountTotal) || "",
            },
          ];
        } else if (
          AccountTree.replace(/\s/g, "") == "TotalOtherCurrentLiability"
        ) {
          recordObj.dataArrTotal = [
            data.balancesheetreport[i]["Account Tree"] || "-",
            {
              type: "amount",
              value: SubAccountTotal || "",
              amount:
                utilityService.convertSubstringParseFloat(SubAccountTotal) ||
                "",
            },
            {
              type: "amount",
              value: HeaderAccountTotal || "",
              amount: utilityService.convertSubstringParseFloat(HeaderAccountTotal) || "",
            },
          ];
        } else if (
          AccountTree.replace(/\s/g, "") == "TotalCurrentLiabilities"
        ) {
          recordObj.dataArrTotal = [
            data.balancesheetreport[i]["Account Tree"] || "-",
            {
              type: "amount",
              value: SubAccountTotal || "",
              amount:
                utilityService.convertSubstringParseFloat(SubAccountTotal) ||
                "",
            },
            {
              type: "amount",
              value: TotalCurrentAsset_Liability || "",
              amount:
                utilityService.convertSubstringParseFloat(TotalCurrentAsset_Liability) || "",
            },
          ];
        } else if (AccountTree.replace(/\s/g, "") == "TotalCapital/Equity") {
          recordObj.dataArrTotal = [
            data.balancesheetreport[i]["Account Tree"] || "-",
            {
              type: "amount",
              value: SubAccountTotal || "",
              amount:
                utilityService.convertSubstringParseFloat(SubAccountTotal) ||
                "",
            },
            {
              type: "amount",
              value: TotalCurrentAsset_Liability || "",
              amount:
                utilityService.convertSubstringParseFloat(TotalCurrentAsset_Liability) || "",
            },
          ];
        } else if (
          AccountTree.replace(/\s/g, "") == "TOTALLIABILITIES&EQUITY"
        ) {
          recordObj.dataArrTotal = [
            data.balancesheetreport[i]["Account Tree"] || "-",
            {
              type: "amount",
              value: SubAccountTotal || "",
              amount:
                utilityService.convertSubstringParseFloat(SubAccountTotal) ||
                "",
            },
            {
              type: "amount",
              value:TotalAsset_Liability || "",
              amount:
                utilityService.convertSubstringParseFloat(TotalAsset_Liability) || "",
            },
          ];

          GrandTotalLiability = TotalAsset_Liability;
        } else if (
          AccountTree.replace(/\s/g, "") == "Capital/Equity" ||
          AccountTree.replace(/\s/g, "") == "OtherCurrentLiability" ||
          AccountTree.replace(/\s/g, "") == "OtherCurrentAsset" ||
          AccountTree.replace(/\s/g, "") == "CreditCardAccount"
        ) {
          recordObj.dataArrAsset = [
            data.balancesheetreport[i]["Account Tree"] || " ",
          ];
          // recordObj.title = data.balancesheetreport[i]["Account Tree"] || " ";
        } else {
          if (flag) {
            let accountCode = "";
            if (data.balancesheetreport[i].AccountNumber) {
              accountCode = data.balancesheetreport[i].AccountNumber + "-";
            }
            recordObj.dataArr2 = [
              accountCode + data.balancesheetreport[i]["Account Tree"] || "-",
              {
                type: "amount",
                value: SubAccountTotal || "",
                amount:
                  utilityService.convertSubstringParseFloat(SubAccountTotal) ||
                  "",
              },
              {
                type: "amount",
                value: HeaderAccountTotal || "",
                amount:
                  utilityService.convertSubstringParseFloat(HeaderAccountTotal) || "",
              },
            ];
          } else {
            recordObj.dataArr2 = [
              data.balancesheetreport[i]["Account Tree"] || "-",
              {
                type: "amount",
                value: SubAccountTotal || "",
                amount:
                  utilityService.convertSubstringParseFloat(SubAccountTotal) ||
                  "",
              },
              {
                type: "amount",
                value: HeaderAccountTotal || "",
                amount:
                  utilityService.convertSubstringParseFloat(HeaderAccountTotal) || "",
              },
            ];
          }
        }
        if( recordObj.dataArr2 ){
          if ( HeaderAccountTotal.replace(/\s/g, "") || SubAccountTotal.replace(/\s/g, "") ) {
            records.push(recordObj);
          }
        }else{
          records.push(recordObj);
        }
      }

      totalNetAssets = GrandTotalAsset - GrandTotalLiability;
      let netAssets = {
        id: "",
        selected: false,
        //   title: "Net Assets",
        //   subTotal: Currency + "0.00",
        //   total: utilityService.modifynegativeCurrencyFormat(totalNetAssets),
        dataTotal: [
          "Net Assets",
          {
            type: "amount",
            value: Currency + "0.00",
            amount: 0.0,
          },
          {
            type: "amount",
            value: utilityService.modifynegativeCurrencyFormat(totalNetAssets),
            amount: utilityService.convertSubstringParseFloat(
              utilityService.modifynegativeCurrencyFormat(totalNetAssets)
            ),
          },
        ],
      };
      records.push(netAssets);
      templateObject.netAssetTotal.set(
        utilityService.modifynegativeCurrencyFormat(totalNetAssets)
      );
    }


    templateObject.records.set(records);
    if (templateObject.records.get()) {
      setTimeout(function () {
        function MakeNegative() {
          $("td").each(function () {
            if (
              $(this)
                .text()
                .indexOf("-" + Currency) >= 0
            )
              $(this).addClass("text-danger");
          });
        }
        MakeNegative();
        $("td a").each(function () {
          if (
            $(this)
              .text()
              .indexOf("-" + Currency) >= 0
          )
            $(this).addClass("text-danger");
        });
      }, 500);
    }

    LoadingOverlay.hide();
  };

  var currentDate2 = new Date();
  var getLoadDate = moment(currentDate2).format("YYYY-MM-DD");
  templateObject.getBalanceSheetReports(getLoadDate);
  $("#balancedate").val(moment(currentDate2).format("DD/MM/YYYY"));

  if (Object.keys(FlowRouter.current().queryParams).length) {
    templateObject
      .$("#balanceDate")
      .val(
        moment(FlowRouter.current().queryParams.balanceDate).format("MMMM YYYY")
      );
    templateObject
      .$("#compareTo")
      .val(FlowRouter.current().queryParams.compareTo);
    templateObject
      .$("#comparePeriod")
      .val(FlowRouter.current().queryParams.comparePeriod);
    templateObject.$("#sort").val(FlowRouter.current().queryParams.sort);
    templateObject.currentMonth.set(
      moment(FlowRouter.current().queryParams.balanceDate).format("MMMM")
    );
    templateObject.$(".update_search").click();
  } else {
    let currentMonth = moment(new Date()).format("MMMM");
    templateObject.currentMonth.set(currentMonth);
    templateObject.currentYear.set(new Date().getFullYear());
    setTimeout(function () {
      templateObject.$(".update_search").click();
    }, 0);
  }
  
  $("#search_list").click(function () {
    let balanceDate = $("#balanceDate").val();
    var SegsBalDate = balanceDate.split(" ");
    var months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    var date = new Date();
    var monthCase;

    switch (SegsBalDate[0]) {
      case "January":
        monthCase = 1;
        break;
      case "February":
        monthCase = 2;
        break;
      case "March":
        monthCase = 3;
        break;
      case "April":
        monthCase = 4;
        break;
      case "May":
        monthCase = 5;
        break;

      case "June":
        monthCase = 6;
        break;
      case "July":
        monthCase = 7;
        break;
      case "August":
        monthCase = 8;
        break;
      case "September":
        monthCase = 9;
        break;
      case "October":
        monthCase = 10;
        break;
      case "November":
        monthCase = 11;
        break;
      case "December":
        monthCase = 12;
        break;
    }
    var lastDay = new Date(SegsBalDate[1], monthCase, 0);
    var dropmonth = monthCase - 1;
    let YearBefore = SegsBalDate[1] - 1;
    let disbalanceDate =
      lastDay.getDate() + " " + months[dropmonth] + " " + SegsBalDate[1];
    let disbalanceAYearDate =
      lastDay.getDate() + " " + months[dropmonth] + " " + YearBefore;

    let searchDateAsOf =
      SegsBalDate[1] + "-" + monthCase + "-" + lastDay.getDate();
    templateObject.dateAsAtAYear.set(disbalanceAYearDate);
    templateObject.dateAsAt.set(disbalanceDate);
  });

  /**
   * Step 1 : We need to get currencies (TCurrency) so we show or hide sub collumns
   * So we have a showable list of currencies to toggle
   */

  templateObject.loadCurrency = async () => {
    await loadCurrency();
  };

  //templateObject.loadCurrency();

  templateObject.loadCurrencyHistory = async () => {
    await loadCurrencyHistory();
  };

  //templateObject.loadCurrencyHistory();

  LoadingOverlay.hide();
});
function sortByAlfa(a, b) {
  return a.currency - b.currency;
}
Template.balancesheetreport.helpers({
  convertAmount: (amount, currencyData) => {
    let currencyList = Template.instance().tcurrencyratehistory.get(); // Get tCurrencyHistory



    if (!amount || amount.trim() == "") {
      return "";
    }
    if (currencyData.code == defaultCurrencyCode) {
      // default currency
      return amount;
    }


    amount = utilityService.convertSubstringParseFloat(amount); // This will remove all currency symbol


    // Lets remove the minus character
    const isMinus = amount < 0;
    if (isMinus == true) amount = amount * -1; // Make it positive

    // get default currency symbol
    // let _defaultCurrency = currencyList.filter(
    //   (a) => a.Code == defaultCurrencyCode
    // )[0];

    //amount = amount.replace(_defaultCurrency.symbol, "");

    // amount =
    //   isNaN(amount) == true
    //     ? parseFloat(amount.substring(1))
    //     : parseFloat(amount);



    // Get the selected date
    let dateTo = $("#balancedate").val();
    const day = dateTo.split("/")[0];
    const m = dateTo.split("/")[1];
    const y = dateTo.split("/")[2];
    dateTo = new Date(y, m, day);
    dateTo.setMonth(dateTo.getMonth() - 1); // remove one month (because we added one before)


    // Filter by currency code
    currencyList = currencyList.filter((a) => a.Code == currencyData.code);


    // if(currencyList.length == 0) {
    //   currencyList = Template.instance().currencyList.get();
    //   currencyList = currencyList.filter((a) => a.Code == currencyData.code);
    // }


    // Sort by the closest date
    currencyList = currencyList.sort((a, b) => {
      a = GlobalFunctions.timestampToDate(a.MsTimeStamp);
      a.setHours(0);
      a.setMinutes(0);
      a.setSeconds(0);

      b = GlobalFunctions.timestampToDate(b.MsTimeStamp);
      b.setHours(0);
      b.setMinutes(0);
      b.setSeconds(0);

      var distancea = Math.abs(dateTo - a);
      var distanceb = Math.abs(dateTo - b);
      return distancea - distanceb; // sort a before b when the distance is smaller

      // const adate= new Date(a.MsTimeStamp);
      // const bdate = new Date(b.MsTimeStamp);

      // if(adate < bdate) {
      //   return 1;
      // }
      // return -1;
    });

    const [firstElem] = currencyList; // Get the firest element of the array which is the closest to that date



    let rate = currencyData.code == defaultCurrencyCode ? 1 : firstElem.BuyRate; // Must used from tcurrecyhistory
    //amount = amount + 0.36;
    amount = parseFloat(amount * rate); // Multiply by the rate
    amount = Number(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }); // Add commas


    // amount = amount.toLocaleString();

    let convertedAmount =
      isMinus == true
        ? `- ${currencyData.symbol} ${amount}`
        : `${currencyData.symbol} ${amount}`;


    return convertedAmount;
  },
  count: (array) => {
    return array.length;
  },
  countActive: (array) => {
    if (array.length == 0) {
      return 0;
    }
    let activeArray = array.filter((c) => c.active == true);
    return activeArray.length;
  },
  currencyList: () => {
    return Template.instance().currencyList.get();
  },
  isNegativeAmount(amount) {
    if (Math.sign(amount) === -1) {
      return true;
    }
    return false;
  },
  isOnlyDefaultActive() {
    const array = Template.instance().currencyList.get();
    if (array.length == 0) {
      return false;
    }
    let activeArray = array.filter((c) => c.active == true);

    if (activeArray.length == 1) {

      if (activeArray[0].code == defaultCurrencyCode) {
        return !true;
      } else {
        return !false;
      }
    } else {
      return !false;
    }
  },
  isCurrencyListActive() {
    const array = Template.instance().currencyList.get();
    let activeArray = array.filter((c) => c.active == true);

    return activeArray.length > 0;
  },
  isObject: (variable) => {
    return typeof variable === "object" && variable !== null;
  },
  currency: () => {
    return Currency;
  },
  companyname: () => {
    return loggedCompany;
  },
  dateAsAt: () => {
    //var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];;
    //var date = new Date();
    //var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    return Template.instance().dateAsAt.get() || "-";
  },
  dateAsAtAYear: () => {
    return Template.instance().dateAsAtAYear.get() || "-";
  },
  records: () => {
    return Template.instance().records.get();
  },

  selectedObj: () => {
    return Template.instance().selectedObj.get().length;
  },

  netAssetTotal: () => {
    return Template.instance().netAssetTotal.get() || 0;
  },
  currentYear: () => {
    return Template.instance().currentYear.get();
  },
  nextYear: () => {
    return Template.instance().nextYear.get();
  },
  currentMonth: () => {
    return Template.instance().currentMonth.get();
  },
  currencyRecord: () => {
    return Template.instance().currencyRecord.get();
  },
  tabinationRecord: () => {
    return Template.instance().tabinationRecord.get();
  },
});

Template.balancesheetreport.events({
  "change input[type='checkbox']": (event) => {
    // This should be global
    $(event.currentTarget).attr(
      "checked",
      $(event.currentTarget).prop("checked")
    );
  },
  "click .currency-modal-save": (e) => {
    //$(e.currentTarget).parentsUntil(".modal").modal("hide");
    LoadingOverlay.show();

    let templateObject = Template.instance();

    // Get all currency list
    let _currencyList = templateObject.currencyList.get();

    // Get all selected currencies
    const currencySelected = $(".currency-selector-js:checked");
    let _currencySelectedList = [];
    if (currencySelected.length > 0) {
      $.each(currencySelected, (index, e) => {
        const sellRate = $(e).attr("sell-rate");
        const buyRate = $(e).attr("buy-rate");
        const currencyCode = $(e).attr("currency");
        const currencyId = $(e).attr("currency-id");
        let _currency = _currencyList.find((c) => c.id == currencyId);
        _currency.active = true;
        _currencySelectedList.push(_currency);
      });
    } else {
      let _currency = _currencyList.find((c) => c.code == defaultCurrencyCode);
      _currency.active = true;
      _currencySelectedList.push(_currency);
    }



    _currencyList.forEach((value, index) => {
      if (_currencySelectedList.some((c) => c.id == _currencyList[index].id)) {
        _currencyList[index].active = _currencySelectedList.find(
          (c) => c.id == _currencyList[index].id
        ).active;
      } else {
        _currencyList[index].active = false;
      }
    });

    _currencyList = _currencyList.sort((a, b) => {
      if (a.code == defaultCurrencyCode) {
        return -1;
      }
      return 1;
    });

    // templateObject.activeCurrencyList.set(_activeCurrencyList);
    templateObject.currencyList.set(_currencyList);

    LoadingOverlay.hide();
  },
  "click .wide_viewbtn": function () {
    $("#wrapper_main").addClass("more-padding-bottom");
    $(".Standard_viewbtn, .header_section").show();
    $(".wide_viewbtn, .active_page").hide();
  },
  "click .Standard_viewbtn": function () {
    $("#wrapper_main").removeClass("more-padding-bottom");
    $(".wide_viewbtn, .active_page").show();
    $(".Standard_viewbtn , .header_section").hide();
  },
  "click .newReportHelp": function () {
    $(".report-tooltip").show();
  },
  "click .close_Bnt": function () {
    $(".report-tooltip").hide();
  },
  "click #printButtonBalanceSheet": function () {
    $("#printBalanceSheet").print({
      prepend:
        "<p style='margin-top: 80px; font-size: 23px;'>" +
        "<strong>" +
        loggedCompany +
        " - Balance Sheet</strong></p></br>",
      title: document.title + " | Balance Sheet | " + loggedCompany,
      noPrintSelector: ".addSummaryEditor",
    });
  },
  "click #balance-excel-export": function () {
    let utilityService = new UtilityService();
    let templateObject = Template.instance();
    const filename = loggedCompany.substring(0, 3) + "-Balance Sheet" + ".xls";
    let rows = [];
    reportService.getBalanceSheetData().then(function (data) {
      if (data.balancesheetreport) {
        rows[0] = ["", "Balance Sheet", ""];
        rows[1] = ["", loggedCompany, ""];
        rows[2] = ["As at", templateObject.dateAsAt.get(), ""];
        data.balancesheetreport.forEach(function (e, i) {
          rows.push([
            data.balancesheetreport[i].ACCNAME,
            data.balancesheetreport[i]["Sub Account Total"],
            data.balancesheetreport[i]["Header Account Total"],
          ]);
        });
        setTimeout(function () {
          utilityService.exportToCsv(rows, filename, "xls");
        }, 1000);
      }
    });
  },
  "click #getPdf": function () {
    let templateObject = Template.instance();
    let utilityService = new UtilityService();
    let tableRecords = templateObject.records.get();
    if (tableRecords.length) {
      let records = [];
      for (let i = 0; i < tableRecords.length; i++) {
        let obj = [];
        if (tableRecords[i].dataArrHeader) {
          obj = [$.trim(tableRecords[i].dataArrHeader[0]), "", ""];
        } else if (tableRecords[i].dataArrAsset) {
          obj = [$.trim(tableRecords[i].dataArrAsset[0]), "", ""];
        } else if (tableRecords[i].dataArr2) {
          obj = [
            $.trim(tableRecords[i].dataArr2[0]),
            $.trim(tableRecords[i].dataArr2[1]),
            $.trim(tableRecords[i].dataArr2[2]),
          ];
        } else if (tableRecords[i].dataTotal) {
          obj = [
            $.trim(tableRecords[i].dataTotal[0]),
            $.trim(tableRecords[i].dataTotal[1]),
            $.trim(tableRecords[i].dataTotal[2]),
          ];
        } else {
          obj = [
            $.trim(tableRecords[i].dataArrTotal[0]),
            $.trim(tableRecords[i].dataArrTotal[1]),
            $.trim(tableRecords[i].dataArrTotal[2]),
          ];
          records.push(obj);
          obj = ["", "", ""];
        }
          records.push(obj);
      }
      let header = [];
      let footer = [];
      let rows = $("#balanceData tbody tr:first td .SubHeading").html();
      $("#generatePdf > tbody> tr > th").each(function () {
        header.push($(this).text());
      });
      let pageOrientation = "portrait-mm-a4";
      let pageTitle = ["", loggedCompany, rows, ""];
      utilityService.exportToPdfReports(
        records,
        "Balance Sheet",
        pageTitle,
        pageOrientation,
        "true",
        header
      );
    }
  },
  "click td.Indent1": async function (event) {
    let id = event.target.className.split("item-value-");
    let accountName = id[1].split("_").join(" ");
    let toDate = moment($("#balanceDate").val()).clone().endOf("month").format("YYYY-MM-DD");
    let fromDate = "1899-01-01";
    Session.setPersistent("showHeader", true);
    await clearData('TAccountRunningBalanceReport');
    window.open("/balancetransactionlist?accountName=" +accountName +"&toDate=" +toDate +"&fromDate=" +fromDate +"&isTabItem=" +false,"_self");
  },
  "click #moreOptionBal": function () {
    $("#more_search").show();
    $("#moreOptionBal").hide();
  },
  "click #fewerOptionbtn": function () {
    $("#more_search").hide();
    $("#moreOptionBal").show();
  },
  "click .currencyDropdown": function (event) {
    $("#currency").val(event.target.innerHTML);
  },
  "click .regionDropdown": function (event) {
    $("#region").val(event.target.innerHTML);
  },
  "click .sortDropdown": function (event) {
    $("#sort").val(event.target.innerHTML);
  },
  "click .compareToDropdown": function (event) {
    $("#compareTo").val(event.target.innerHTML);
  },
  "click .comparePeriodDropdown": function (event) {
    $("#comparePeriod").val(event.target.innerHTML);
  },
  "click .balanceDateDropdown": function (event) {
    $("#balanceDate").val(event.target.innerHTML);
  },
  "click .update_search": function () {
    let templateObject = Template.instance();
    let balanceDate = templateObject.$("#balanceDate").val();
    let compareTo = templateObject.$("#compareTo").val();
    let comparePeriod = templateObject.$("#comparePeriod").val();
    let sort = templateObject.$("#sort").val();
    let Date = moment(balanceDate).clone().endOf("month").format("YYYY-MM-DD");
    templateObject.getBalanceSheetReports(Date);
    let url =
      "/reports/balance-sheet?balanceDate=" +
      moment(balanceDate).clone().endOf("month").format("YYYY-MM-DD") +
      "&compareTo=" +
      compareTo +
      "&comparePeriod=" +
      comparePeriod +
      "&sort=" +
      sort;
    if (!Session.get("AgedReceivablesTemplate")) {
      FlowRouter.go(url);
    }
  },
  "change .balancedate": function () {
    let templateObject = Template.instance();
    $(".fullScreenSpin").css("display", "inline-block");
    let balanceDate = templateObject.$("#balancedate").val();
    let formatBalDate = moment(balanceDate).format("YYYY-MM-DD");
    localStorage.setItem("VS1BalanceSheet_Report", "");
    templateObject.getBalanceSheetReports(formatBalDate);
    var formatDate = moment(balanceDate).format("DD MMM YYYY");
    templateObject.dateAsAt.set(formatDate);
  },
  "click .lastMonth": function () {
    let templateObject = Template.instance();
    $(".fullScreenSpin").css("display", "inline-block");
    var dateTo = new Date($("#balancedate").datepicker("getDate"));
    //if(dateTo.getMonth()+1)
    localStorage.setItem("VS1BalanceSheet_Report", "");
    let formatDateTo =
      dateTo.getFullYear() + "-" + dateTo.getMonth() + "-" + dateTo.getDate();
    templateObject.getBalanceSheetReports(formatDateTo);

    let fromDateMonth = dateTo.getMonth();
    let fromDateDay = dateTo.getDate();

    if (dateTo.getMonth() + 1 < 10) {
      fromDateMonth = "0" + dateTo.getMonth();
    }

    if (dateTo.getDate() < 10) {
      fromDateDay = "0" + dateTo.getDate();
    }
    var formatDate =
      fromDateDay + "/" + fromDateMonth + "/" + dateTo.getFullYear();
    templateObject.dateAsAt.set(formatDate);
    $("#balancedate").val(formatDate);
  },
  "click #lastQuarter": function () {
    let templateObject = Template.instance();
    $(".fullScreenSpin").css("display", "inline-block");
    localStorage.setItem("VS1BalanceSheet_Report", "");
    $("#balancedate").attr("readonly", false);
    var currentDate = new Date();
    var begunDate = moment(currentDate).format("DD/MM/YYYY");

    var begunDate = moment(currentDate).format("DD/MM/YYYY");
    function getQuarter(d) {
      d = d || new Date();
      var m = Math.floor(d.getMonth() / 3) + 2;
      return m > 4 ? m - 4 : m;
    }

    var quarterAdjustment = (moment().month() % 3) + 1;
    var lastQuarterEndDate = moment()
      .subtract({ months: quarterAdjustment })
      .endOf("month");
    var lastQuarterStartDate = lastQuarterEndDate
      .clone()
      .subtract({ months: 2 })
      .startOf("month");

    var lastQuarterStartDateFormat =
      moment(lastQuarterStartDate).format("DD/MM/YYYY");
    var lastQuarterEndDateFormat =
      moment(lastQuarterEndDate).format("DD/MM/YYYY");

    templateObject.dateAsAt.set(lastQuarterStartDateFormat);
    $("#balancedate").val(lastQuarterStartDateFormat);

    let fromDateMonth = getQuarter(currentDate);
    var quarterMonth = getQuarter(currentDate);
    let fromDateDay = currentDate.getDate();

    var getLoadDate = moment(lastQuarterEndDate).format("YYYY-MM-DD");
    let getDateFrom = moment(lastQuarterStartDateFormat).format("YYYY-MM-DD");
    templateObject.getBalanceSheetReports(getDateFrom);
  },
  "click #last12Months": function () {
    let templateObject = Template.instance();
    $(".fullScreenSpin").css("display", "inline-block");
    localStorage.setItem("VS1BalanceSheet_Report", "");
    $("#balancedate").attr("readonly", false);
    var currentDate = new Date();
    var begunDate = moment(currentDate).format("DD/MM/YYYY");

    let fromDateMonth = Math.floor(currentDate.getMonth() + 1);
    let fromDateDay = currentDate.getDate();
    if (currentDate.getMonth() + 1 < 10) {
      fromDateMonth = "0" + (currentDate.getMonth() + 1);
    }
    if (currentDate.getDate() < 10) {
      fromDateDay = "0" + currentDate.getDate();
    }

    var fromDate =
      fromDateDay +
      "/" +
      fromDateMonth +
      "/" +
      Math.floor(currentDate.getFullYear() - 1);
    templateObject.dateAsAt.set(begunDate);
    $("#balancedate").val(lastQuarterStartDateFormat);

    var currentDate2 = new Date();
    var getLoadDate = moment(currentDate2).format("YYYY-MM-DD");
    let getDateFrom =
      Math.floor(currentDate2.getFullYear() - 1) +
      "-" +
      Math.floor(currentDate2.getMonth() + 1) +
      "-" +
      currentDate2.getDate();
    templateObject.getBalanceSheetReports(getDateFrom);
  },
  "click #ignoreDate": function () {
    let templateObject = Template.instance();
    $(".fullScreenSpin").css("display", "inline-block");
    localStorage.setItem("VS1BalanceSheet_Report", "");
    $("#balancedate").attr("readonly", true);
    templateObject.dateAsAt.set("Current Date");
    templateObject.getBalanceSheetReports("", "", true);
  },
  "click .sales-tab-item": function (event) {
    let tempInstance = Template.instance();
    let accountName = event.target.id.split("tabitem-")[1];
    accountName = accountName.split("_").join(" ");
    let toDate = moment($("#balanceDate").val())
      .clone()
      .endOf("month")
      .format("YYYY-MM-DD");
    let fromDate = moment($("#balanceDate").val())
      .clone()
      .startOf("year")
      .format("YYYY-MM-DD");
    window.open(
      "/balance-sheet-detail?accountName=" +
        accountName +
        "&toDate=" +
        toDate +
        "&fromDate=" +
        fromDate +
        "&isTabItem=" +
        true,
      "_self"
    );
  },
  "click #add-summary": function () {
    tinymce.remove();
    let utilityService = new UtilityService();
    let tempInstance = Template.instance();
    tempInstance.$("#add-summary").hide();
    utilityService.addSummaryTinyMCEditor("#editor-text");
    $("#editor-text_ifr").contents().find("p").css("margin", "0px");
    $("#summary-title").show();
    $("#tiny-editor").show();
    $("#editor-buttons").show();
    $(".text-editor-bg").show();
  },

  "click #cancel-editor": function () {
    $("#tiny-editor").hide();
    $("#editor-buttons").hide();
    $("#add-summary").show();
    $("#summary-title").hide();
    $(".text-editor-bg").hide();
  },

  "click #save-summary": function () {
    let tempInstance = Template.instance();
    tinymce.triggerSave();
    let summaryValue = $("#editor-text").val();
    $(".text-editor-bg").hide();
    let summaryItem =
      '<tr id="summary-row" class="summary-row"><td class="NotesDiv" colspan="12">' +
      '<div class="summary-item">' +
      '<span id="summary-number" class="summary-number"></span>' +
      '<span class="summary-text" id="summary-text-item">' +
      summaryValue +
      "</div></td></tr>";
    //tempInstance.$('.summarySection').append(summaryItem);

    $("#tiny-editor").hide();
    $("#editor-buttons").hide();
  },
  "click .btnRefresh": function () {
    $(".fullScreenSpin").css("display", "inline-block");
    localStorage.setItem("VS1BalanceSheet_Report", "");
    Meteor._reload.reload();
  },
  "click .btnPrintReport": function (event) {
    $("a").attr("href", "/");
    document.title = "Balance Sheet Report";
    $(".printReport").print({
      title: document.title + " | Balance Sheet | " + loggedCompany,
      noPrintSelector: ".addSummaryEditor",
      mediaPrint: false,
    });

    setTimeout(function () {
      $("a").attr("href", "#");
    }, 100);
  },
  "click .btnExportReport": function () {
    $(".fullScreenSpin").css("display", "inline-block");
    let utilityService = new UtilityService();
    let templateObject = Template.instance();
    let balanceDate = new Date($("#balancedate").datepicker("getDate"));

    let formatBalDate =
      balanceDate.getFullYear() +
      "-" +
      (balanceDate.getMonth() + 1) +
      "-" +
      balanceDate.getDate();

    const filename = loggedCompany + "-Balance Sheet" + ".csv";
    utilityService.exportReportToCsvTable("tableExport", filename, "csv");
    let rows = [];
    // reportService.getBalanceSheetReport(formatBalDate).then(function (data) {
    //     if(data.balancesheetreport){
    //         rows[0] = ['Account Tree','Account Number', 'Sub Total', 'Totals'];
    //         data.balancesheetreport.forEach(function (e, i) {
    //             rows.push([data.balancesheetreport[i]['Account Tree'],data.balancesheetreport[i].AccountNumber, utilityService.modifynegativeCurrencyFormat(data.balancesheetreport[i]['Sub Account Total']),utilityService.modifynegativeCurrencyFormat(data.balancesheetreport[i]['Header Account Total'])]);
    //         });
    //         setTimeout(function () {
    //             utilityService.exportReportToCsv(rows, filename, 'xls');
    //             $('.fullScreenSpin').css('display','none');
    //         }, 1000);
    //     }
    //
    // });
  },
  "keyup #myInputSearch": function (event) {
    $(".table tbody tr").show();
    let searchItem = $(event.target).val();
    if (searchItem != "") {
      var value = searchItem.toLowerCase();
      $(".table tbody tr").each(function () {
        var found = "false";
        $(this).each(function () {
          if ($(this).text().toLowerCase().indexOf(value.toLowerCase()) >= 0) {
            found = "true";
          }
        });
        if (found == "true") {
          $(this).show();
        } else {
          $(this).hide();
        }
      });
    } else {
      $(".table tbody tr").show();
    }
  },
  "blur #myInputSearch": function (event) {
    $(".table tbody tr").show();
    let searchItem = $(event.target).val();
    if (searchItem != "") {
      var value = searchItem.toLowerCase();
      $(".table tbody tr").each(function () {
        var found = "false";
        $(this).each(function () {
          if ($(this).text().toLowerCase().indexOf(value.toLowerCase()) >= 0) {
            found = "true";
          }
        });
        if (found == "true") {
          $(this).show();
        } else {
          $(this).hide();
        }
      });
    } else {
      $(".table tbody tr").show();
    }
  },
  "click .fx-rate-btn": async (e) => {
    await loadCurrency();
    //loadCurrencyHistory();
  },
});

Template.registerHelper("equal", function (a, b) {
  return a == b;
});

Template.registerHelper("equals", function (a, b) {
  return a === b;
});

Template.registerHelper("notEquals", function (a, b) {
  return a != b;
});

Template.registerHelper("containsequals", function (a, b) {
  let chechTotal = false;
  if (a.toLowerCase().indexOf(b.toLowerCase()) >= 0) {
    chechTotal = true;
  }
  return chechTotal;
});

Template.registerHelper("shortDate", function (a) {
  let dateIn = a;
  let dateOut = moment(dateIn, "DD/MM/YYYY").format("MMM YYYY");
  return dateOut;
});

Template.registerHelper("noDecimal", function (a) {
  let numIn = a;
  // numIn= $(numIn).val().substring(1);
  // numIn= $(numIn).val().replace('$','');

  // numIn= $numIn.text().replace('-','');
  let numOut = parseInt(numIn);
  return numOut;
});

/**
 *
 */
async function loadCurrency() {
  let templateObject = Template.instance();

  if ((await templateObject.currencyList.get().length) == 0) {
    LoadingOverlay.show();

    let _currencyList = [];
    const result = await taxRateService.getCurrencies();

    //taxRateService.getCurrencies().then((result) => {

    const data = result.tcurrency;

    for (let i = 0; i < data.length; i++) {
      // let taxRate = (data.tcurrency[i].fields.Rate * 100).toFixed(2) + '%';
      var dataList = {
        id: data[i].Id || "",
        code: data[i].Code || "-",
        currency: data[i].Currency || "NA",
        symbol: data[i].CurrencySymbol || "NA",
        buyrate: data[i].BuyRate || "-",
        sellrate: data[i].SellRate || "-",
        country: data[i].Country || "NA",
        description: data[i].CurrencyDesc || "-",
        ratelastmodified: data[i].RateLastModified || "-",
        active: data[i].Code == defaultCurrencyCode ? true : false, // By default if AUD then true
        //active: false,
        // createdAt: new Date(data[i].MsTimeStamp) || "-",
        // formatedCreatedAt: formatDateToString(new Date(data[i].MsTimeStamp))
      };

      _currencyList.push(dataList);
      //}
    }
    _currencyList = _currencyList.sort((a, b) => {
      return a.currency
        .split("")[0]
        .toLowerCase()
        .localeCompare(b.currency.split("")[0].toLowerCase());
    });



    templateObject.currencyList.set(_currencyList);

    await loadCurrencyHistory(templateObject);
    LoadingOverlay.hide();
    //});
  }
}

async function loadCurrencyHistory(templateObject) {
  let result = await taxRateService.getCurrencyHistory();
  const data = result.tcurrencyratehistory;
  templateObject.tcurrencyratehistory.set(data);
  LoadingOverlay.hide();
}
