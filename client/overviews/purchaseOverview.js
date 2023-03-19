import { PurchaseBoardService } from "../js/purchase-service";
import { ReactiveVar } from "meteor/reactive-var";
import { CoreService } from "../js/core-service";
import { EmployeeProfileService } from "../js/profile-service";
import draggableCharts from "../js/Charts/draggableCharts";
import { AccountService } from "../accounts/account-service";
import { UtilityService } from "../utility-service";
import { PaymentsService } from "../payments/payments-service";
import { SideBarService } from "../js/sidebar-service";
import {OrganisationService} from '../js/organisation-service';
import "../lib/global/indexdbstorage.js";

let sideBarService = new SideBarService();
let utilityService = new UtilityService();
let _ = require("lodash");

Template.purchasesoverview.onCreated(function () {
  const templateObject = Template.instance();
  templateObject.datatablerecords = new ReactiveVar([]);
  templateObject.tableheaderrecords = new ReactiveVar([]);

  templateObject.creditperc = new ReactiveVar();
  templateObject.billperc = new ReactiveVar();
  templateObject.poperc = new ReactiveVar();
  templateObject.billpercTotal = new ReactiveVar();
  templateObject.creditpercTotal = new ReactiveVar();
  templateObject.popercTotal = new ReactiveVar();

  templateObject.custfields = new ReactiveVar([]);
  templateObject.displayfields = new ReactiveVar([]);
});

Template.purchasesoverview.onRendered(function () {
  $(".fullScreenSpin").css("display", "inline-block");
  let templateObject = Template.instance();
  let accountService = new AccountService();
  let purchaseService = new PurchaseBoardService();
  let paymentService = new PaymentsService();
  const supplierList = [];
  let purchaseOrderTable;
  var splashArray = new Array();
  const dataTableList = [];
  const tableHeaderList = [];
  let totAmount = 0;
  let totAmountBill = 0;
  let totAmountCredit = 0;

  let totCreditCount = 0;
  let totBillCount = 0;
  let totPOCount = 0;

  var today = moment().format("DD/MM/YYYY");
  var currentDate = new Date();
  var begunDate = moment(currentDate).format("DD/MM/YYYY");
  let fromDateMonth = currentDate.getMonth() + 1;
  let fromDateDay = currentDate.getDate();
  if (currentDate.getMonth() + 1 < 10) {
    fromDateMonth = "0" + (currentDate.getMonth() + 1);
  }

  if (currentDate.getDate() < 10) {
    fromDateDay = "0" + currentDate.getDate();
  }
  var fromDate =
    fromDateDay + "/" + fromDateMonth + "/" + currentDate.getFullYear();

  $("#date-input,#dateTo,#dateFrom").datepicker({
    showOn: "button",
    buttonText: "Show Date",
    buttonImageOnly: true,
    buttonImage: "/img/imgCal2.png",
    dateFormat: "dd/mm/yy",
    showOtherMonths: true,
    selectOtherMonths: true,
    changeMonth: true,
    changeYear: true,
    yearRange: "-90:+10",
    onChangeMonthYear: function(year, month, inst){
    // Set date to picker
    $(this).datepicker('setDate', new Date(year, inst.selectedMonth, inst.selectedDay));
    // Hide (close) the picker
    // $(this).datepicker('hide');
    // // Change ttrigger the on change function
    // $(this).trigger('change');
   }
  });

  $("#dateFrom").val(fromDate);
  $("#dateTo").val(begunDate);

  var ctx = document.getElementById("myChartCustomer").getContext("2d");

  var date = new Date();
  var month = date.getMonth() + 1;
  date.setDate(1);
  var all_days = [];
  var all_daysNoYear = [];
  while (date.getMonth() + 1 == month) {
    var d = date.getFullYear() +"-" +month.toString().padStart(2, "0") +"-" +date.getDate().toString().padStart(2, "0");
    var dnoyear = moment(month.toString().padStart(2, "0")).format("MMMM").substring(0, 3) +" " +date.getDate().toString().padStart(2, "0");
    all_days.push(d);
    all_daysNoYear.push(dnoyear);
    date.setDate(date.getDate() + 1);
  }

  function MakeNegative() {
      $('td').each(function() {
          if ($(this).text().indexOf('-' + Currency) >= 0) $(this).addClass('text-danger')
      });
      $('td.colStatus').each(function() {
          if ($(this).text() == "Deleted") $(this).addClass('text-deleted');
          if ($(this).text() == "Reconciled") $(this).addClass('text-reconciled');
          if ($(this).text() == "Paid") $(this).addClass('text-fullyPaid');
          if ($(this).text() == "Partial Paid") $(this).addClass('text-partialPaid');
      });
  };

  templateObject.resetData = function (dataVal) {
    location.reload();
  };

  templateObject.getAllPurchaseOrderAll = function () {
    var currentBeginDate = new Date();
    var begunDate = moment(currentBeginDate).format("DD/MM/YYYY");
    let fromDateMonth = currentBeginDate.getMonth() + 1;
    let fromDateDay = currentBeginDate.getDate();
    if (currentBeginDate.getMonth() + 1 < 10) {
      fromDateMonth = "0" + (currentBeginDate.getMonth() + 1);
    } else {
      fromDateMonth = currentBeginDate.getMonth() + 1;
    }

    if (currentBeginDate.getDate() < 10) {
      fromDateDay = "0" + currentBeginDate.getDate();
    }
    var toDate = currentBeginDate.getFullYear() + "-" + fromDateMonth + "-" + fromDateDay;
    let prevMonth11Date = moment().subtract(reportsloadMonths, "months").format("YYYY-MM-DD");

    getVS1Data("TPurchasesList").then(function (dataObject) {
        if (dataObject.length == 0) {
          sideBarService.getAllPurchasesList(prevMonth11Date,toDate,true,initialReportLoad,0).then(function (data) {
              addVS1Data("TPurchasesList", JSON.stringify(data));
              let lineItems = [];
              let lineItemObj = {};

              let totalExpense = 0;
              let totalBill = 0;
              let totalCredit = 0;
              let totalPO = 0;

              for (let i = 0; i < data.tbilllist.length; i++) {
                let orderType = "PO";
                totalExpense += Number(data.tbilllist[i].TotalAmountInc);
                if (data.tbilllist[i].IsCredit == true) {
                  totCreditCount++;
                  orderType = "Credit";
                  totalCredit += Number(data.tbilllist[i].TotalAmountInc);
                }

                if (data.tbilllist[i].IsBill == true) {
                  totBillCount++;
                  orderType = "Bill";
                  totalBill += Number(data.tbilllist[i].TotalAmountInc);
                }

                if (data.tbilllist[i].IsPO == true) {
                  totPOCount++;
                  orderType = "PO";
                  totalPO += Number(data.tbilllist[i].TotalAmountInc);
                }
                let totalAmountEx = utilityService.modifynegativeCurrencyFormat(data.tbilllist[i].TotalAmount) || 0.0;
                let totalTax = utilityService.modifynegativeCurrencyFormat(data.tbilllist[i].TotalTax) || 0.0;
                let totalAmount =utilityService.modifynegativeCurrencyFormat(data.tbilllist[i].TotalAmountInc) || 0.0;
                let amountPaidCalc =data.tbilllist[i].Payment||0.0;
                let totalPaid =utilityService.modifynegativeCurrencyFormat(amountPaidCalc) ||0.0;
                let totalOutstanding =utilityService.modifynegativeCurrencyFormat(data.tbilllist[i].Balance) || 0.0;
                let orderstatus = data.tbilllist[i].OrderStatus || '';
                if(data.tbilllist[i].Deleted == true){
                  orderstatus = "Deleted";
                }else if(data.tbilllist[i].SupplierName == ''){
                  orderstatus = "Deleted";
                };
                var dataList = {
                  id: data.tbilllist[i].PurchaseOrderID || "",
                  employee: data.tbilllist[i].EmployeeName || "",
                  sortdate:data.tbilllist[i].OrderDate != "" ? moment(data.tbilllist[i].OrderDate).format("YYYY/MM/DD"): data.tbilllist[i].OrderDate,
                  orderdate:data.tbilllist[i].OrderDate != "" ? moment(data.tbilllist[i].OrderDate).format("DD/MM/YYYY"): data.tbilllist[i].OrderDate,
                  suppliername: data.tbilllist[i].SupplierName || "",
                  totalamountex: totalAmountEx || 0.0,
                  totaltax: totalTax || 0.0,
                  totalamount: totalAmount || 0.0,
                  totalpaid: totalPaid || 0.0,
                  totaloustanding: totalOutstanding || 0.0,
                  type: orderType || "",
                  orderstatus: orderstatus || "",
                  Phone: data.tbilllist[i].Phone || "",
                  InvoiceNumber: data.tbilllist[i].InvoiceNumber || "",
                  custfield1: data.tbilllist[i].SaleCustField1 || '',
                  custfield2: data.tbilllist[i].SaleCustField2 || '',
                  custfield3: data.tbilllist[i].SaleCustField3 || '',
                  comments: data.tbilllist[i].Comments || "",
                };
                //if (data.tbilllist[i].Deleted == false) {
                  dataTableList.push(dataList);
                  if (data.tbilllist[i].Balance != 0) {
                    if (data.tbilllist[i].IsPO == true) {
                      totAmount += Number(data.tbilllist[i].Balance);
                    }
                    if (data.tbilllist[i].IsBill == true) {
                      totAmountBill += Number(data.tbilllist[i].Balance);
                    }
                    if (data.tbilllist[i].IsCredit == true) {
                      totAmountCredit += Number(data.tbilllist[i].Balance);
                    }
                  }
                //}
                $(".suppAwaitingAmt").text(utilityService.modifynegativeCurrencyFormat(totAmount));
                $(".billAmt").text(utilityService.modifynegativeCurrencyFormat(totAmountBill));
                $(".creditAmt").text(utilityService.modifynegativeCurrencyFormat(totAmountCredit));
              }

              var totalPerc = Math.abs(totalCredit) + Math.abs(totalBill) + Math.abs(totalPO);

              var xwidth = (Math.abs(totalCredit) / totalPerc) * 100;
              var ywidth = (Math.abs(totalBill) / totalPerc) * 100;
              var zwidth = (Math.abs(totalPO) / totalPerc) * 100;

              templateObject.creditpercTotal.set(Math.round(xwidth));
              templateObject.billpercTotal.set(Math.round(ywidth));
              templateObject.popercTotal.set(Math.round(zwidth));

              templateObject.datatablerecords.set(dataTableList);
              $(".spExpenseTotal").text(utilityService.modifynegativeCurrencyFormat(totalExpense));

              if (templateObject.datatablerecords.get()) {


                function MakeNegative() {
                    $('td').each(function() {
                        if ($(this).text().indexOf('-' + Currency) >= 0) $(this).addClass('text-danger')
                    });
                    $('td.colStatus').each(function() {
                        if ($(this).text() == "Deleted") $(this).addClass('text-deleted');
                        if ($(this).text() == "Reconciled") $(this).addClass('text-reconciled');
                        if ($(this).text() == "Paid") $(this).addClass('text-fullyPaid');
                        if ($(this).text() == "Partial Paid") $(this).addClass('text-partialPaid');
                    });
                };
                setTimeout(function () {
                var myChart = new Chart(ctx, {
                  type: "pie",
                  data: {
                    labels: ["Credit", "Bill", "Purchase Order"],
                    datasets: [
                      {
                        label: "Credit",
                        backgroundColor: [
                          "#e74a3b",
                          "#f6c23e",
                          "#1cc88a",
                          "#36b9cc",
                        ],
                        borderColor: ["#ffffff", "#ffffff", "#ffffff", "#ffffff"],
                        data: [totCreditCount, totBillCount, totPOCount],
                      },
                    ],
                  },
                  options: {
                    maintainAspectRatio: true,
                    legend: {
                      display: true,
                      position: "right",
                      reverse: false,
                    },
                    title: {
                      display: false,
                    },
                  },
                });

                  MakeNegative();
                }, 100);
              }
              setTimeout(function () {
                $(".fullScreenSpin").css("display", "none");
                $("#tblPurchaseOverview").DataTable({
                    columnDefs: [
                      {
                        type: "date",
                        targets: 0,
                      },
                    ],
                    sDom: "<'row'><'row'<'col-sm-12 col-lg-6'f><'col-sm-12 col-lg-6 colDateFilter'l>r>t<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>B",
                    buttons: [
                      {
                        extend: "excelHtml5",
                        text: "",
                        download: "open",
                        className: "btntabletocsv hiddenColumn",
                        filename: "Purchase Overview List - " + moment().format(),
                        orientation: "portrait",
                        exportOptions: {
                          columns: ":visible",
                          format: {
                            body: function (data, row, column) {
                              if (data.includes("</span>")) {
                                var res = data.split("</span>");
                                data = res[1];
                              }

                              return column == 1
                                ? data.replace(/<.*?>/gi, "")
                                : data;
                            },
                          },
                        },
                      },
                      {
                        extend: "print",
                        download: "open",
                        className: "btntabletopdf hiddenColumn",
                        text: "",
                        title: "Purchase Overview",
                        filename: "Purchase Overview List - " + moment().format(),
                        exportOptions: {
                          columns: ":visible",
                          stripHtml: false,
                        },
                      },
                    ],
                    select: true,
                    destroy: true,
                    colReorder: true,
                    pageLength: initialDatatableLoad,
                    bLengthChange: false,
                    lengthMenu: [[initialDatatableLoad, -1],[initialDatatableLoad, "All"]],
                    info: true,
                    responsive: true,
                    order: [[0, "desc"],[2, "desc"],],
                    action: function () {
                      $("#tblPurchaseOverview").DataTable().ajax.reload();
                    },
                    fnDrawCallback: function (oSettings) {
                      let checkurlIgnoreDate =
                        FlowRouter.current().queryParams.ignoredate;
                      $(".paginate_button.page-item").removeClass("disabled");
                      $("#tblPurchaseOverview_ellipsis").addClass("disabled");

                      if (oSettings._iDisplayLength == -1) {
                        if (oSettings.fnRecordsDisplay() > 150) {
                          $(".paginate_button.page-item.previous").addClass(
                            "disabled"
                          );
                          $(".paginate_button.page-item.next").addClass(
                            "disabled"
                          );
                        }
                      } else {
                      }
                      if (oSettings.fnRecordsDisplay() < initialDatatableLoad) {
                        $(".paginate_button.page-item.next").addClass("disabled");
                      }
                      $(".paginate_button.next:not(.disabled)",this.api().table().container()).on("click", function () {
                        $(".fullScreenSpin").css("display", "inline-block");
                        let dataLenght = oSettings._iDisplayLength;

                        var dateFrom = new Date(
                          $("#dateFrom").datepicker("getDate")
                        );
                        var dateTo = new Date($("#dateTo").datepicker("getDate"));

                        let formatDateFrom = dateFrom.getFullYear() +"-" +(dateFrom.getMonth() + 1) +"-" +dateFrom.getDate();
                        let formatDateTo =dateTo.getFullYear() +"-" +(dateTo.getMonth() + 1) +"-" +dateTo.getDate();
                        if(data.Params.IgnoreDates == true){
                          sideBarService.getAllPurchasesList(formatDateFrom,formatDateTo,true,initialDatatableLoad,oSettings.fnRecordsDisplay()).then(function (dataObjectnew) {
                              getVS1Data("TPurchasesList").then(function (dataObjectold) {
                                  if (dataObjectold.length == 0) {
                                  } else {
                                    let dataOld = JSON.parse(dataObjectold[0].data);
                                    var thirdaryData = $.merge($.merge([], dataObjectnew.tbilllist),dataOld.tbilllist);
                                    let objCombineData = {
                                      Params: dataOld.Params,
                                      tbilllist: thirdaryData,
                                    };

                                    addVS1Data("TPurchasesList",JSON.stringify(objCombineData)).then(function (datareturn) {
                                        templateObject.resetData(objCombineData);
                                        $(".fullScreenSpin").css("display","none");
                                      }).catch(function (err) {
                                        $(".fullScreenSpin").css("display","none");
                                      });
                                  }
                                }).catch(function (err) {});
                            }).catch(function (err) {
                              $(".fullScreenSpin").css("display", "none");
                            });
                        } else {
                          sideBarService.getAllPurchasesList(formatDateFrom,formatDateTo,false,initialDatatableLoad,oSettings.fnRecordsDisplay()).then(function (dataObjectnew) {
                              getVS1Data("TPurchasesList").then(function (dataObjectold) {
                                  if (dataObjectold.length == 0) {
                                  } else {
                                    let dataOld = JSON.parse(dataObjectold[0].data);
                                    var thirdaryData = $.merge($.merge([], dataObjectnew.tbilllist),dataOld.tbilllist);
                                    let objCombineData = {
                                      Params: dataOld.Params,
                                      tbilllist: thirdaryData,
                                    };

                                    addVS1Data("TPurchasesList",JSON.stringify(objCombineData)).then(function (datareturn) {
                                        templateObject.resetData(objCombineData);
                                        $(".fullScreenSpin").css("display","none");
                                      }).catch(function (err) {
                                        $(".fullScreenSpin").css("display","none");
                                      });
                                  }
                                }).catch(function (err) {});
                            }).catch(function (err) {
                              $(".fullScreenSpin").css("display", "none");
                            });
                        }
                      });

                      //}
                      setTimeout(function () {
                        MakeNegative();
                      }, 100);
                    },
                    fnInitComplete: function () {
                      this.fnPageChange("last");
                      $(
                        "<button class='btn btn-primary btnRefresh' type='button' id='btnRefreshPurchaseOverview' style='padding: 4px 10px; font-size: 16px; margin-left: 8px !important;'><i class='fas fa-search-plus' style='margin-right: 5px'></i>Search</button>"
                      ).insertAfter("#tblPurchaseOverview_filter");

                      $(".myvarFilterForm").appendTo(".colDateFilter");
                    },
                    fnInfoCallback: function (oSettings,iStart,iEnd,iMax,iTotal,sPre) {
                      let countTableData = data.Params.Count || 0; //get count from API data
                      return ("Showing " +iStart +" to " +iEnd +" of " +countTableData);
                    },
                  }).on("page", function () {
                    setTimeout(function () {
                      MakeNegative();
                    }, 100);
                  })
                  .on("column-reorder", function () {});
                $(".fullScreenSpin").css("display", "none");
                $("div.dataTables_filter input").addClass(
                  "form-control form-control-sm"
                );
              }, 0);

              var columns = $("#tblPurchaseOverview th");
              let sTible = "";
              let sWidth = "";
              let sIndex = "";
              let sVisible = "";
              let columVisible = false;
              let sClass = "";
              $.each(columns, function (i, v) {
                if (v.hidden == false) {
                  columVisible = true;
                }
                if (v.className.includes("hiddenColumn")) {
                  columVisible = false;
                }
                sWidth = v.style.width.replace("px", "");

                let datatablerecordObj = {
                  sTitle: v.innerText || "",
                  sWidth: sWidth || "",
                  sIndex: v.cellIndex || "",
                  sVisible: columVisible || false,
                  sClass: v.className || "",
                };
                tableHeaderList.push(datatablerecordObj);
              });
              templateObject.tableheaderrecords.set(tableHeaderList);
              $("div.dataTables_filter input").addClass("form-control form-control-sm");
              $("#tblPurchaseOverview tbody").on("click", "tr", function () {
                var listData = $(this).closest("tr").attr("id");
                var transactiontype = $(event.target).closest("tr").find(".colType").text();
                if (listData && transactiontype) {
                  if (transactiontype == "Purchase Order") {
                    FlowRouter.go("/purchaseordercard?id=" + listData);
                  } else if (transactiontype == "Bill") {
                    FlowRouter.go("/billcard?id=" + listData);
                  } else if (transactiontype == "Credit") {
                    FlowRouter.go("/creditcard?id=" + listData);
                  } else if (transactiontype == "PO") {
                    FlowRouter.go("/purchaseordercard?id=" + listData);
                  } else {
                    //FlowRouter.go('/purchaseordercard?id=' + listData);
                  }
                }

              });

              let filterData = _.filter(data.tbilllist, function (data) {
                return data.SupplierName;
              });

              let graphData = _.orderBy(filterData, "OrderDate");

              let daysDataArray = [];
              let currentDateNow = new Date();

              let initialData = _.filter(graphData,(obj) =>moment(obj.OrderDate).format("YYYY-MM-DD") ==moment(currentDateNow).format("YYYY-MM-DD"));
              let groupData = _.omit(_.groupBy(initialData, "OrderDate"), [""]);
            }).catch(function (err) {
              // Bert.alert('<strong>' + err + '</strong>!', 'danger');
              $(".fullScreenSpin").css("display", "none");
              // Meteor._reload.reload();
            });
        } else {
          let data = JSON.parse(dataObject[0].data);
          let useData = data.tbilllist;
          let lineItems = [];
          let lineItemObj = {};
          if (data.Params.IgnoreDates == true) {
            $("#dateFrom").attr("readonly", true);
            $("#dateTo").attr("readonly", true);
            //FlowRouter.go("/purchasesoverview?ignoredate=true");
          } else {
            $('#dateFrom').attr('readonly', false);
            $('#dateTo').attr('readonly', false);
            $("#dateFrom").val(data.Params.DateFrom != ""? moment(data.Params.DateFrom).format("DD/MM/YYYY"): data.Params.DateFrom);
            $("#dateTo").val(data.Params.DateTo != ""? moment(data.Params.DateTo).format("DD/MM/YYYY"): data.Params.DateTo);
          }
          let totalExpense = 0;
          let totalBill = 0;
          let totalCredit = 0;
          let totalPO = 0;
          $(".fullScreenSpin").css("display", "none");

          for (let i = 0; i < data.tbilllist.length; i++) {
            let orderType = "PO";
            totalExpense += Number(data.tbilllist[i].TotalAmountInc);
            if (data.tbilllist[i].IsCredit == true) {
              totCreditCount++;
              orderType = "Credit";
              totalCredit += Number(data.tbilllist[i].TotalAmountInc);
            }

            if (data.tbilllist[i].IsBill == true) {
              totBillCount++;
              orderType = "Bill";
              totalBill += Number(data.tbilllist[i].TotalAmountInc);
            }

            if (data.tbilllist[i].IsPO == true) {
              totPOCount++;
              orderType = "PO";
              totalPO += Number(data.tbilllist[i].TotalAmountInc);
            }
            let totalAmountEx = utilityService.modifynegativeCurrencyFormat(data.tbilllist[i].TotalAmount) || 0.0;
            let totalTax = utilityService.modifynegativeCurrencyFormat(data.tbilllist[i].TotalTax) || 0.0;
            let totalAmount =utilityService.modifynegativeCurrencyFormat(data.tbilllist[i].TotalAmountInc) || 0.0;
            let amountPaidCalc =data.tbilllist[i].Payment||0.0;
            let totalPaid =utilityService.modifynegativeCurrencyFormat(amountPaidCalc) ||0.0;
            let totalOutstanding =utilityService.modifynegativeCurrencyFormat(data.tbilllist[i].Balance) || 0.0;
            let orderstatus = data.tbilllist[i].OrderStatus || '';
            if(data.tbilllist[i].Deleted == true){
              orderstatus = "Deleted";
            }else if(data.tbilllist[i].SupplierName == ''){
              orderstatus = "Deleted";
            };
            var dataList = {
              id: data.tbilllist[i].PurchaseOrderID || "",
              employee: data.tbilllist[i].EmployeeName || "",
              sortdate:data.tbilllist[i].OrderDate != "" ? moment(data.tbilllist[i].OrderDate).format("YYYY/MM/DD"): data.tbilllist[i].OrderDate,
              orderdate:data.tbilllist[i].OrderDate != "" ? moment(data.tbilllist[i].OrderDate).format("DD/MM/YYYY"): data.tbilllist[i].OrderDate,
              suppliername: data.tbilllist[i].SupplierName || "",
              totalamountex: totalAmountEx || 0.0,
              totaltax: totalTax || 0.0,
              totalamount: totalAmount || 0.0,
              totalpaid: totalPaid || 0.0,
              totaloustanding: totalOutstanding || 0.0,
              type: orderType || "",
              orderstatus: orderstatus || "",
              Phone: data.tbilllist[i].Phone || "",
              InvoiceNumber: data.tbilllist[i].InvoiceNumber || "",
              custfield1: data.tbilllist[i].SaleCustField1 || '',
              custfield2: data.tbilllist[i].SaleCustField2 || '',
              custfield3: data.tbilllist[i].SaleCustField3 || '',
              comments: data.tbilllist[i].Comments || "",
            };
            //if (data.tbilllist[i].Deleted == false) {
              dataTableList.push(dataList);
              if (data.tbilllist[i].Balance != 0) {
                if (data.tbilllist[i].IsPO == true) {
                  totAmount += Number(data.tbilllist[i].Balance);
                }
                if (data.tbilllist[i].IsBill == true) {
                  totAmountBill += Number(data.tbilllist[i].Balance);
                }
                if (data.tbilllist[i].IsCredit == true) {
                  totAmountCredit += Number(data.tbilllist[i].Balance);
                }
              }
            //}
            $(".suppAwaitingAmt").text(utilityService.modifynegativeCurrencyFormat(totAmount));
            $(".billAmt").text(utilityService.modifynegativeCurrencyFormat(totAmountBill));
            $(".creditAmt").text(utilityService.modifynegativeCurrencyFormat(totAmountCredit));
          }

          var totalPerc = Math.abs(totalCredit) + Math.abs(totalBill) + Math.abs(totalPO);

          var xwidth = (Math.abs(totalCredit) / totalPerc) * 100;
          var ywidth = (Math.abs(totalBill) / totalPerc) * 100;
          var zwidth = (Math.abs(totalPO) / totalPerc) * 100;

          templateObject.creditpercTotal.set(Math.round(xwidth));
          templateObject.billpercTotal.set(Math.round(ywidth));
          templateObject.popercTotal.set(Math.round(zwidth));

          templateObject.datatablerecords.set(dataTableList);
          $(".spExpenseTotal").text(utilityService.modifynegativeCurrencyFormat(totalExpense));

          if (templateObject.datatablerecords.get()) {


            function MakeNegative() {
                $('td').each(function() {
                    if ($(this).text().indexOf('-' + Currency) >= 0) $(this).addClass('text-danger')
                });
                $('td.colStatus').each(function() {
                    if ($(this).text() == "Deleted") $(this).addClass('text-deleted');
                    if ($(this).text() == "Reconciled") $(this).addClass('text-reconciled');
                    if ($(this).text() == "Paid") $(this).addClass('text-fullyPaid');
                    if ($(this).text() == "Partial Paid") $(this).addClass('text-partialPaid');
                });
            };
            setTimeout(function () {
            var myChart = new Chart(ctx, {
              type: "pie",
              data: {
                labels: ["Credit", "Bill", "Purchase Order"],
                datasets: [
                  {
                    label: "Credit",
                    backgroundColor: [
                      "#e74a3b",
                      "#f6c23e",
                      "#1cc88a",
                      "#36b9cc",
                    ],
                    borderColor: ["#ffffff", "#ffffff", "#ffffff", "#ffffff"],
                    data: [totCreditCount, totBillCount, totPOCount],
                  },
                ],
              },
              options: {
                maintainAspectRatio: true,
                legend: {
                  display: true,
                  position: "right",
                  reverse: false,
                },
                title: {
                  display: false,
                },
              },
            });

              MakeNegative();
            }, 100);
          }
          setTimeout(function () {
            $(".fullScreenSpin").css("display", "none");
            $("#tblPurchaseOverview").DataTable({
                columnDefs: [
                  {
                    type: "date",
                    targets: 0,
                  },
                ],
                sDom: "<'row'><'row'<'col-sm-12 col-lg-6'f><'col-sm-12 col-lg-6 colDateFilter'l>r>t<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>B",
                buttons: [
                  {
                    extend: "excelHtml5",
                    text: "",
                    download: "open",
                    className: "btntabletocsv hiddenColumn",
                    filename: "Purchase Overview List - " + moment().format(),
                    orientation: "portrait",
                    exportOptions: {
                      columns: ":visible",
                      format: {
                        body: function (data, row, column) {
                          if (data.includes("</span>")) {
                            var res = data.split("</span>");
                            data = res[1];
                          }

                          return column == 1
                            ? data.replace(/<.*?>/gi, "")
                            : data;
                        },
                      },
                    },
                  },
                  {
                    extend: "print",
                    download: "open",
                    className: "btntabletopdf hiddenColumn",
                    text: "",
                    title: "Purchase Overview",
                    filename: "Purchase Overview List - " + moment().format(),
                    exportOptions: {
                      columns: ":visible",
                      stripHtml: false,
                    },
                  },
                ],
                select: true,
                destroy: true,
                colReorder: true,
                pageLength: initialDatatableLoad,
                bLengthChange: false,
                lengthMenu: [[initialDatatableLoad, -1],[initialDatatableLoad, "All"]],
                info: true,
                responsive: true,
                order: [[0, "desc"],[2, "desc"],],
                action: function () {
                  $("#tblPurchaseOverview").DataTable().ajax.reload();
                },
                fnDrawCallback: function (oSettings) {
                  let checkurlIgnoreDate =
                    FlowRouter.current().queryParams.ignoredate;
                  $(".paginate_button.page-item").removeClass("disabled");
                  $("#tblPurchaseOverview_ellipsis").addClass("disabled");

                  if (oSettings._iDisplayLength == -1) {
                    if (oSettings.fnRecordsDisplay() > 150) {
                      $(".paginate_button.page-item.previous").addClass(
                        "disabled"
                      );
                      $(".paginate_button.page-item.next").addClass(
                        "disabled"
                      );
                    }
                  } else {
                  }
                  if (oSettings.fnRecordsDisplay() < initialDatatableLoad) {
                    $(".paginate_button.page-item.next").addClass("disabled");
                  }
                  $(".paginate_button.next:not(.disabled)",this.api().table().container()).on("click", function () {
                    $(".fullScreenSpin").css("display", "inline-block");
                    let dataLenght = oSettings._iDisplayLength;

                    var dateFrom = new Date(
                      $("#dateFrom").datepicker("getDate")
                    );
                    var dateTo = new Date($("#dateTo").datepicker("getDate"));

                    let formatDateFrom = dateFrom.getFullYear() +"-" +(dateFrom.getMonth() + 1) +"-" +dateFrom.getDate();
                    let formatDateTo =dateTo.getFullYear() +"-" +(dateTo.getMonth() + 1) +"-" +dateTo.getDate();
                    if(data.Params.IgnoreDates == true){
                      sideBarService.getAllPurchasesList(formatDateFrom,formatDateTo,true,initialDatatableLoad,oSettings.fnRecordsDisplay()).then(function (dataObjectnew) {
                          getVS1Data("TPurchasesList").then(function (dataObjectold) {
                              if (dataObjectold.length == 0) {
                              } else {
                                let dataOld = JSON.parse(dataObjectold[0].data);
                                var thirdaryData = $.merge($.merge([], dataObjectnew.tbilllist),dataOld.tbilllist);
                                let objCombineData = {
                                  Params: dataOld.Params,
                                  tbilllist: thirdaryData,
                                };

                                addVS1Data("TPurchasesList",JSON.stringify(objCombineData)).then(function (datareturn) {
                                    templateObject.resetData(objCombineData);
                                    $(".fullScreenSpin").css("display","none");
                                  }).catch(function (err) {
                                    $(".fullScreenSpin").css("display","none");
                                  });
                              }
                            }).catch(function (err) {});
                        }).catch(function (err) {
                          $(".fullScreenSpin").css("display", "none");
                        });
                    } else {
                      sideBarService.getAllPurchasesList(formatDateFrom,formatDateTo,false,initialDatatableLoad,oSettings.fnRecordsDisplay()).then(function (dataObjectnew) {
                          getVS1Data("TPurchasesList").then(function (dataObjectold) {
                              if (dataObjectold.length == 0) {
                              } else {
                                let dataOld = JSON.parse(dataObjectold[0].data);
                                var thirdaryData = $.merge($.merge([], dataObjectnew.tbilllist),dataOld.tbilllist);
                                let objCombineData = {
                                  Params: dataOld.Params,
                                  tbilllist: thirdaryData,
                                };

                                addVS1Data("TPurchasesList",JSON.stringify(objCombineData)).then(function (datareturn) {
                                    templateObject.resetData(objCombineData);
                                    $(".fullScreenSpin").css("display","none");
                                  }).catch(function (err) {
                                    $(".fullScreenSpin").css("display","none");
                                  });
                              }
                            }).catch(function (err) {});
                        }).catch(function (err) {
                          $(".fullScreenSpin").css("display", "none");
                        });
                    }
                  });

                  //}
                  setTimeout(function () {
                    MakeNegative();
                  }, 100);
                },
                fnInitComplete: function () {
                  this.fnPageChange("last");
                  $(
                    "<button class='btn btn-primary btnRefresh' type='button' id='btnRefreshPurchaseOverview' style='padding: 4px 10px; font-size: 16px; margin-left: 8px !important;'><i class='fas fa-search-plus' style='margin-right: 5px'></i>Search</button>"
                  ).insertAfter("#tblPurchaseOverview_filter");

                  $(".myvarFilterForm").appendTo(".colDateFilter");
                },
                fnInfoCallback: function (oSettings,iStart,iEnd,iMax,iTotal,sPre) {
                  let countTableData = data.Params.Count || 0; //get count from API data
                  return ("Showing " +iStart +" to " +iEnd +" of " +countTableData);
                },
              }).on("page", function () {
                setTimeout(function () {
                  MakeNegative();
                }, 100);
              }).on("column-reorder", function () {});
            $(".fullScreenSpin").css("display", "none");
            $("div.dataTables_filter input").addClass(
              "form-control form-control-sm"
            );
          }, 0);

          var columns = $("#tblPurchaseOverview th");
          let sTible = "";
          let sWidth = "";
          let sIndex = "";
          let sVisible = "";
          let columVisible = false;
          let sClass = "";
          $.each(columns, function (i, v) {
            if (v.hidden == false) {
              columVisible = true;
            }
            if (v.className.includes("hiddenColumn")) {
              columVisible = false;
            }
            sWidth = v.style.width.replace("px", "");

            let datatablerecordObj = {
              sTitle: v.innerText || "",
              sWidth: sWidth || "",
              sIndex: v.cellIndex || "",
              sVisible: columVisible || false,
              sClass: v.className || "",
            };
            tableHeaderList.push(datatablerecordObj);
          });
          templateObject.tableheaderrecords.set(tableHeaderList);
          $("div.dataTables_filter input").addClass(
            "form-control form-control-sm"
          );
          $("#tblPurchaseOverview tbody").on("click", "tr", function () {
            var listData = $(this).closest("tr").attr("id");
            var transactiontype = $(event.target)
              .closest("tr")
              .find(".colType")
              .text();
            if (listData && transactiontype) {
              if (transactiontype == "Purchase Order") {
                FlowRouter.go("/purchaseordercard?id=" + listData);
              } else if (transactiontype == "Bill") {
                FlowRouter.go("/billcard?id=" + listData);
              } else if (transactiontype == "Credit") {
                FlowRouter.go("/creditcard?id=" + listData);
              } else if (transactiontype == "PO") {
                FlowRouter.go("/purchaseordercard?id=" + listData);
              } else {
                //FlowRouter.go('/purchaseordercard?id=' + listData);
              }
            }

            // if(listData){
            //   FlowRouter.go('/purchaseordercard?id=' + listData);
            // }
          });

          let filterData = _.filter(useData, function (data) {
            return data.SupplierName;
          });

          let graphData = _.orderBy(filterData, "OrderDate");

          let daysDataArray = [];
          let currentDateNow = new Date();

          let initialData = _.filter(graphData,(obj) => moment(obj.OrderDate).format("YYYY-MM-DD") == moment(currentDateNow).format("YYYY-MM-DD"));
          let groupData = _.omit(_.groupBy(initialData, "OrderDate"), [""]);
        }
      }).catch(function (err) {
        sideBarService.getAllPurchasesList(prevMonth11Date,toDate,true,initialReportLoad,0).then(function (data) {
            addVS1Data("TPurchasesList", JSON.stringify(data));
            let lineItems = [];
            let lineItemObj = {};

            let totalExpense = 0;
            let totalBill = 0;
            let totalCredit = 0;
            let totalPO = 0;

            for (let i = 0; i < data.tbilllist.length; i++) {
              let orderType = "PO";
              totalExpense += Number(data.tbilllist[i].TotalAmountInc);
              if (data.tbilllist[i].IsCredit == true) {
                totCreditCount++;
                orderType = "Credit";
                totalCredit += Number(data.tbilllist[i].TotalAmountInc);
              }

              if (data.tbilllist[i].IsBill == true) {
                totBillCount++;
                orderType = "Bill";
                totalBill += Number(data.tbilllist[i].TotalAmountInc);
              }

              if (data.tbilllist[i].IsPO == true) {
                totPOCount++;
                orderType = "PO";
                totalPO += Number(data.tbilllist[i].TotalAmountInc);
              }
              let totalAmountEx = utilityService.modifynegativeCurrencyFormat(data.tbilllist[i].TotalAmount) || 0.0;
              let totalTax = utilityService.modifynegativeCurrencyFormat(data.tbilllist[i].TotalTax) || 0.0;
              let totalAmount =utilityService.modifynegativeCurrencyFormat(data.tbilllist[i].TotalAmountInc) || 0.0;
              let amountPaidCalc =data.tbilllist[i].Payment||0.0;
              let totalPaid =utilityService.modifynegativeCurrencyFormat(amountPaidCalc) ||0.0;
              let totalOutstanding =utilityService.modifynegativeCurrencyFormat(data.tbilllist[i].Balance) || 0.0;
              let orderstatus = data.tbilllist[i].OrderStatus || '';
              if(data.tbilllist[i].Deleted == true){
                orderstatus = "Deleted";
              }else if(data.tbilllist[i].SupplierName == ''){
                orderstatus = "Deleted";
              };
              var dataList = {
                id: data.tbilllist[i].PurchaseOrderID || "",
                employee: data.tbilllist[i].EmployeeName || "",
                sortdate:data.tbilllist[i].OrderDate != "" ? moment(data.tbilllist[i].OrderDate).format("YYYY/MM/DD"): data.tbilllist[i].OrderDate,
                orderdate:data.tbilllist[i].OrderDate != "" ? moment(data.tbilllist[i].OrderDate).format("DD/MM/YYYY"): data.tbilllist[i].OrderDate,
                suppliername: data.tbilllist[i].SupplierName || "",
                totalamountex: totalAmountEx || 0.0,
                totaltax: totalTax || 0.0,
                totalamount: totalAmount || 0.0,
                totalpaid: totalPaid || 0.0,
                totaloustanding: totalOutstanding || 0.0,
                type: orderType || "",
                orderstatus: orderstatus || "",
                Phone: data.tbilllist[i].Phone || "",
                InvoiceNumber: data.tbilllist[i].InvoiceNumber || "",
                custfield1: data.tbilllist[i].SaleCustField1 || '',
                custfield2: data.tbilllist[i].SaleCustField2 || '',
                custfield3: data.tbilllist[i].SaleCustField3 || '',
                comments: data.tbilllist[i].Comments || "",
              };
              //if (data.tbilllist[i].Deleted == false) {
                dataTableList.push(dataList);
                if (data.tbilllist[i].Balance != 0) {
                  if (data.tbilllist[i].IsPO == true) {
                    totAmount += Number(data.tbilllist[i].Balance);
                  }
                  if (data.tbilllist[i].IsBill == true) {
                    totAmountBill += Number(data.tbilllist[i].Balance);
                  }
                  if (data.tbilllist[i].IsCredit == true) {
                    totAmountCredit += Number(data.tbilllist[i].Balance);
                  }
                }
              //}
              $(".suppAwaitingAmt").text(utilityService.modifynegativeCurrencyFormat(totAmount));
              $(".billAmt").text(utilityService.modifynegativeCurrencyFormat(totAmountBill));
              $(".creditAmt").text(utilityService.modifynegativeCurrencyFormat(totAmountCredit));
            }

            var totalPerc = Math.abs(totalCredit) + Math.abs(totalBill) + Math.abs(totalPO);

            var xwidth = (Math.abs(totalCredit) / totalPerc) * 100;
            var ywidth = (Math.abs(totalBill) / totalPerc) * 100;
            var zwidth = (Math.abs(totalPO) / totalPerc) * 100;

            templateObject.creditpercTotal.set(Math.round(xwidth));
            templateObject.billpercTotal.set(Math.round(ywidth));
            templateObject.popercTotal.set(Math.round(zwidth));

            templateObject.datatablerecords.set(dataTableList);
            $(".spExpenseTotal").text(utilityService.modifynegativeCurrencyFormat(totalExpense));

            if (templateObject.datatablerecords.get()) {


              function MakeNegative() {
                  $('td').each(function() {
                      if ($(this).text().indexOf('-' + Currency) >= 0) $(this).addClass('text-danger')
                  });
                  $('td.colStatus').each(function() {
                      if ($(this).text() == "Deleted") $(this).addClass('text-deleted');
                      if ($(this).text() == "Reconciled") $(this).addClass('text-reconciled');
                      if ($(this).text() == "Paid") $(this).addClass('text-fullyPaid');
                      if ($(this).text() == "Partial Paid") $(this).addClass('text-partialPaid');
                  });
              };
              setTimeout(function () {
              var myChart = new Chart(ctx, {
                type: "pie",
                data: {
                  labels: ["Credit", "Bill", "Purchase Order"],
                  datasets: [
                    {
                      label: "Credit",
                      backgroundColor: [
                        "#e74a3b",
                        "#f6c23e",
                        "#1cc88a",
                        "#36b9cc",
                      ],
                      borderColor: ["#ffffff", "#ffffff", "#ffffff", "#ffffff"],
                      data: [totCreditCount, totBillCount, totPOCount],
                    },
                  ],
                },
                options: {
                  maintainAspectRatio: true,
                  legend: {
                    display: true,
                    position: "right",
                    reverse: false,
                  },
                  title: {
                    display: false,
                  },
                },
              });

                MakeNegative();
              }, 100);
            }
            setTimeout(function () {
              $(".fullScreenSpin").css("display", "none");
              $("#tblPurchaseOverview").DataTable({
                  columnDefs: [
                    {
                      type: "date",
                      targets: 0,
                    },
                  ],
                  sDom: "<'row'><'row'<'col-sm-12 col-lg-6'f><'col-sm-12 col-lg-6 colDateFilter'l>r>t<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>B",
                  buttons: [
                    {
                      extend: "excelHtml5",
                      text: "",
                      download: "open",
                      className: "btntabletocsv hiddenColumn",
                      filename: "Purchase Overview List - " + moment().format(),
                      orientation: "portrait",
                      exportOptions: {
                        columns: ":visible",
                        format: {
                          body: function (data, row, column) {
                            if (data.includes("</span>")) {
                              var res = data.split("</span>");
                              data = res[1];
                            }

                            return column == 1
                              ? data.replace(/<.*?>/gi, "")
                              : data;
                          },
                        },
                      },
                    },
                    {
                      extend: "print",
                      download: "open",
                      className: "btntabletopdf hiddenColumn",
                      text: "",
                      title: "Purchase Overview",
                      filename: "Purchase Overview List - " + moment().format(),
                      exportOptions: {
                        columns: ":visible",
                        stripHtml: false,
                      },
                    },
                  ],
                  select: true,
                  destroy: true,
                  colReorder: true,
                  pageLength: initialDatatableLoad,
                  bLengthChange: false,
                  lengthMenu: [[initialDatatableLoad, -1],[initialDatatableLoad, "All"]],
                  info: true,
                  responsive: true,
                  order: [[0, "desc"],[2, "desc"],],
                  action: function () {
                    $("#tblPurchaseOverview").DataTable().ajax.reload();
                  },
                  fnDrawCallback: function (oSettings) {
                    let checkurlIgnoreDate =
                      FlowRouter.current().queryParams.ignoredate;
                    $(".paginate_button.page-item").removeClass("disabled");
                    $("#tblPurchaseOverview_ellipsis").addClass("disabled");

                    if (oSettings._iDisplayLength == -1) {
                      if (oSettings.fnRecordsDisplay() > 150) {
                        $(".paginate_button.page-item.previous").addClass(
                          "disabled"
                        );
                        $(".paginate_button.page-item.next").addClass(
                          "disabled"
                        );
                      }
                    } else {
                    }
                    if (oSettings.fnRecordsDisplay() < initialDatatableLoad) {
                      $(".paginate_button.page-item.next").addClass("disabled");
                    }
                    $(".paginate_button.next:not(.disabled)",this.api().table().container()).on("click", function () {
                      $(".fullScreenSpin").css("display", "inline-block");
                      let dataLenght = oSettings._iDisplayLength;

                      var dateFrom = new Date(
                        $("#dateFrom").datepicker("getDate")
                      );
                      var dateTo = new Date($("#dateTo").datepicker("getDate"));

                      let formatDateFrom = dateFrom.getFullYear() +"-" +(dateFrom.getMonth() + 1) +"-" +dateFrom.getDate();
                      let formatDateTo =dateTo.getFullYear() +"-" +(dateTo.getMonth() + 1) +"-" +dateTo.getDate();
                      if(data.Params.IgnoreDates == true){
                        sideBarService.getAllPurchasesList(formatDateFrom,formatDateTo,true,initialDatatableLoad,oSettings.fnRecordsDisplay()).then(function (dataObjectnew) {
                            getVS1Data("TPurchasesList").then(function (dataObjectold) {
                                if (dataObjectold.length == 0) {
                                } else {
                                  let dataOld = JSON.parse(dataObjectold[0].data);
                                  var thirdaryData = $.merge($.merge([], dataObjectnew.tbilllist),dataOld.tbilllist);
                                  let objCombineData = {
                                    Params: dataOld.Params,
                                    tbilllist: thirdaryData,
                                  };

                                  addVS1Data("TPurchasesList",JSON.stringify(objCombineData)).then(function (datareturn) {
                                      templateObject.resetData(objCombineData);
                                      $(".fullScreenSpin").css("display","none");
                                    }).catch(function (err) {
                                      $(".fullScreenSpin").css("display","none");
                                    });
                                }
                              }).catch(function (err) {});
                          }).catch(function (err) {
                            $(".fullScreenSpin").css("display", "none");
                          });
                      } else {
                        sideBarService.getAllPurchasesList(formatDateFrom,formatDateTo,false,initialDatatableLoad,oSettings.fnRecordsDisplay()).then(function (dataObjectnew) {
                            getVS1Data("TPurchasesList").then(function (dataObjectold) {
                                if (dataObjectold.length == 0) {
                                } else {
                                  let dataOld = JSON.parse(dataObjectold[0].data);
                                  var thirdaryData = $.merge($.merge([], dataObjectnew.tbilllist),dataOld.tbilllist);
                                  let objCombineData = {
                                    Params: dataOld.Params,
                                    tbilllist: thirdaryData,
                                  };

                                  addVS1Data("TPurchasesList",JSON.stringify(objCombineData)).then(function (datareturn) {
                                      templateObject.resetData(objCombineData);
                                      $(".fullScreenSpin").css("display","none");
                                    }).catch(function (err) {
                                      $(".fullScreenSpin").css("display","none");
                                    });
                                }
                              }).catch(function (err) {});
                          }).catch(function (err) {
                            $(".fullScreenSpin").css("display", "none");
                          });
                      }
                    });

                    //}
                    setTimeout(function () {
                      MakeNegative();
                    }, 100);
                  },
                  fnInitComplete: function () {
                    this.fnPageChange("last");
                    $(
                      "<button class='btn btn-primary btnRefresh' type='button' id='btnRefreshPurchaseOverview' style='padding: 4px 10px; font-size: 16px; margin-left: 8px !important;'><i class='fas fa-search-plus' style='margin-right: 5px'></i>Search</button>"
                    ).insertAfter("#tblPurchaseOverview_filter");

                    $(".myvarFilterForm").appendTo(".colDateFilter");
                  },
                  fnInfoCallback: function (
                    oSettings,
                    iStart,
                    iEnd,
                    iMax,
                    iTotal,
                    sPre
                  ) {
                    let countTableData = data.Params.Count || 0; //get count from API data

                    return (
                      "Showing " +
                      iStart +
                      " to " +
                      iEnd +
                      " of " +
                      countTableData
                    );
                  },
                })
                .on("page", function () {
                  setTimeout(function () {
                    MakeNegative();
                  }, 100);
                })
                .on("column-reorder", function () {});
              $(".fullScreenSpin").css("display", "none");
              $("div.dataTables_filter input").addClass(
                "form-control form-control-sm"
              );
            }, 0);

            var columns = $("#tblPurchaseOverview th");
            let sTible = "";
            let sWidth = "";
            let sIndex = "";
            let sVisible = "";
            let columVisible = false;
            let sClass = "";
            $.each(columns, function (i, v) {
              if (v.hidden == false) {
                columVisible = true;
              }
              if (v.className.includes("hiddenColumn")) {
                columVisible = false;
              }
              sWidth = v.style.width.replace("px", "");

              let datatablerecordObj = {
                sTitle: v.innerText || "",
                sWidth: sWidth || "",
                sIndex: v.cellIndex || "",
                sVisible: columVisible || false,
                sClass: v.className || "",
              };
              tableHeaderList.push(datatablerecordObj);
            });
            templateObject.tableheaderrecords.set(tableHeaderList);
            $("div.dataTables_filter input").addClass(
              "form-control form-control-sm"
            );
            $("#tblPurchaseOverview tbody").on("click", "tr", function () {
              var listData = $(this).closest("tr").attr("id");
              var transactiontype = $(event.target)
                .closest("tr")
                .find(".colType")
                .text();
              if (listData && transactiontype) {
                if (transactiontype == "Purchase Order") {
                  FlowRouter.go("/purchaseordercard?id=" + listData);
                } else if (transactiontype == "Bill") {
                  FlowRouter.go("/billcard?id=" + listData);
                } else if (transactiontype == "Credit") {
                  FlowRouter.go("/creditcard?id=" + listData);
                } else if (transactiontype == "PO") {
                  FlowRouter.go("/purchaseordercard?id=" + listData);
                } else {
                  //FlowRouter.go('/purchaseordercard?id=' + listData);
                }
              }

              // if(listData){
              //   FlowRouter.go('/purchaseordercard?id=' + listData);
              // }
            });

            let filterData = _.filter(data.tbilllist, function (data) {
              return data.SupplierName;
            });

            let graphData = _.orderBy(filterData, "OrderDate");

            let daysDataArray = [];
            let currentDateNow = new Date();

            let initialData = _.filter(
              graphData,
              (obj) =>
                moment(obj.OrderDate).format("YYYY-MM-DD") ==
                moment(currentDateNow).format("YYYY-MM-DD")
            );
            let groupData = _.omit(_.groupBy(initialData, "OrderDate"), [""]);
          }).catch(function (err) {
            // Bert.alert('<strong>' + err + '</strong>!', 'danger');
            $(".fullScreenSpin").css("display", "none");
            // Meteor._reload.reload();
          });
      });
  };

  templateObject.getAllPurchaseOrderAll();
  templateObject.getAllFilterPurchasesData = function (fromDate,toDate,ignoreDate) {
    sideBarService.getAllPurchasesList(fromDate,toDate,ignoreDate,initialReportLoad,0).then(function (data) {
        addVS1Data("TPurchasesList", JSON.stringify(data)).then(function (datareturn) {
            location.reload();
          }).catch(function (err) {
            location.reload();
          });
      }).catch(function (err) {
        var myChart = new Chart(ctx, {
          type: "pie",
          data: {
            labels: ["Credit", "Bill", "Purchase Order"],
            datasets: [
              {
                label: "Credit",
                backgroundColor: ["#e74a3b", "#f6c23e", "#1cc88a", "#36b9cc"],
                borderColor: ["#ffffff", "#ffffff", "#ffffff", "#ffffff"],
                data: ["7", "20", "73"],
              },
            ],
          },
          options: {
            maintainAspectRatio: true,
            legend: {
              display: true,
              position: "right",
              reverse: false,
            },
            title: {
              display: false,
            },
          },
        });
        $(".fullScreenSpin").css("display", "none");
        // Meteor._reload.reload();
      });
  };

  let urlParametersDateFrom = FlowRouter.current().queryParams.fromDate;
  let urlParametersDateTo = FlowRouter.current().queryParams.toDate;
  let urlParametersIgnoreDate = FlowRouter.current().queryParams.ignoredate;
  if (urlParametersDateFrom) {
    if (urlParametersIgnoreDate == true) {
      $("#dateFrom").attr("readonly", true);
      $("#dateTo").attr("readonly", true);
    } else {
      $("#dateFrom").val(
        urlParametersDateFrom != ""
          ? moment(urlParametersDateFrom).format("DD/MM/YYYY")
          : urlParametersDateFrom
      );
      $("#dateTo").val(
        urlParametersDateTo != ""
          ? moment(urlParametersDateTo).format("DD/MM/YYYY")
          : urlParametersDateTo
      );
    }
  }
  // $(".connectedSortable").sortable({
  //   connectWith: ".connectedSortable",
  //   stop: function (event, ui) {
  //     // $('.connectedSortable').each(function() {
  //     //     // result = "";
  //     //     // $(this).find("li").each(function(){
  //     //     //     result += $(this).text() + ",";
  //     //     // });
  //     //     //$("."+$(this).attr("id")+".list").html(result);
  //     // });
  //   },
  // });
  //$(element).resizable().draggable();
  //   $(".portlet").addClass("ui-widget ui-widget-content ui-helper-clearfix ui-corner-all").find(".portlet-header").addClass("ui-widget-header ui-corner-all").prepend(
  //     "<span class='ui-icon ui-icon-minusthick portlet-toggle'></span>");
  //
  // $(".portlet-toggle").on("click", function() {
  //   var icon = $(this);
  //   icon.toggleClass("ui-icon-minusthick ui-icon-plusthick");
  //   icon.closest(".portlet").find(".portlet-content").toggle();
  // });

  //$(".portlet").resizable();

  // custom field displaysettings

  function initCustomFieldDisplaySettings(data, listType) {
    let custFields = [];
    let dispFields = [];
    let customData = {};
    let customFieldCount = 13;

    let reset_data = [
      { label: 'Order Date', class: 'colOrderDate', active: true, width: 0 },
      { label: 'Order No.', class: 'colPurchaseNo', active: true, width: 0 },
      { label: 'Type', class: 'colType', active: true, width: 0 },
      { label: 'Supplier', class: 'colSupplier', active: true, width: 0 },
      { label: 'Amount(Ex)', class: 'colAmountEx', active: true, width: 0 },
      { label: 'Tax', class: 'colTax', active: true, width: 0 },
      { label: 'Amount', class: 'colAmount', active: true, width: 0 },
      { label: 'Outstanding', class: 'colBalanceOutstanding', active: true, width: 0 },
      { label: 'Status', class: 'colStatus', active: true, width: 0 },
      { label: 'Phone', class: 'colPurchaseCustField1', active: false, width: 0 },
      { label: 'Invoice No.', class: 'colPurchaseCustField2', active: false, width: 0 },
      { label: 'Contact', class: 'colEmployee', active: false, width: 0 },
      { label: 'Comments', class: 'colComments', active: true, width: 0 }
    ];

    for (let x = 0; x < data.tcustomfieldlist.length; x++) {
      if (data.tcustomfieldlist[x].fields.ListType == 'ltOrder') {
        customData = {
          active: data.tcustomfieldlist[x].fields.Active || false,
          id: parseInt(data.tcustomfieldlist[x].fields.ID) || 0,
          custfieldlabel: data.tcustomfieldlist[x].fields.Description || "",
          datatype: data.tcustomfieldlist[x].fields.DataType || "",
          isempty: data.tcustomfieldlist[x].fields.ISEmpty || false,
          iscombo: data.tcustomfieldlist[x].fields.IsCombo || false,
          dropdown: data.tcustomfieldlist[x].fields.Dropdown || null,
        };
        custFields.push(customData);
      } else if (data.tcustomfieldlist[x].fields.ListType == listType) {
        customData = {
          active: data.tcustomfieldlist[x].fields.Active || false,
          id: parseInt(data.tcustomfieldlist[x].fields.ID) || 0,
          custfieldlabel: data.tcustomfieldlist[x].fields.Description || "",
          datatype: data.tcustomfieldlist[x].fields.DataType || "",
          isempty: data.tcustomfieldlist[x].fields.ISEmpty || false,
          iscombo: data.tcustomfieldlist[x].fields.IsCombo || false,
          dropdown: data.tcustomfieldlist[x].fields.Dropdown || null,
          // width: data.tcustomfieldlist[x].fields.Width || 0,
        };
        dispFields.push(customData);
      }
    }

    if (custFields.length < 3) {
      let remainder = 3 - custFields.length;
      let getRemCustomFields = parseInt(custFields.length);
      for (let r = 0; r < remainder; r++) {
        getRemCustomFields++;
        customData = {
          active: false,
          id: "",
          custfieldlabel: "Custom Field " + getRemCustomFields,
          datatype: "",
          isempty: true,
          iscombo: false,
        };
        // count++;
        custFields.push(customData);
      }
    }

    if (dispFields.length < customFieldCount) {
      let remainder = customFieldCount - dispFields.length;
      let getRemCustomFields = parseInt(dispFields.length);
      for (let r = 0; r < remainder; r++) {
        customData = {
          active: reset_data[getRemCustomFields].active,
          id: "",
          custfieldlabel: reset_data[getRemCustomFields].label,
          datatype: "",
          isempty: true,
          iscombo: false,
          // width: reset_data[getRemCustomFields].width,
        };
        getRemCustomFields++;
        // count++;
        dispFields.push(customData);
      }
    }

    for (let index = 0; index < custFields.length; index++) {
      const element = custFields[index];
      dispFields.push(element);

    }

    templateObject.custfields.set(custFields);
    templateObject.displayfields.set(dispFields);
  }

  templateObject.getAllCustomFieldDisplaySettings = function () {

      let listType = "ltPurchaseOverview";
      try {
        getVS1Data("TltPurchaseOverview").then(function (dataObject) {
          if (dataObject.length == 0) {
            sideBarService.getAllCustomFieldsWithQuery(listType).then(function (data) {
              initCustomFieldDisplaySettings(data, listType);
              addVS1Data("TltPurchaseOverview", JSON.stringify(data));
            });
          } else {
            let data = JSON.parse(dataObject[0].data);
            initCustomFieldDisplaySettings(data, listType);
            sideBarService.getAllCustomFieldsWithQuery(listType).then(function (data) {
              addVS1Data("TltPurchaseOverview", JSON.stringify(data));
            });
          }
        })

      } catch (error) {
      }
  }

  templateObject.getAllCustomFieldDisplaySettings();

});

Template.purchasesoverview.events({
  "mouseover .card-header": (e) => {
    $(e.currentTarget).parent(".card").addClass("hovered");
  },
  "mouseleave .card-header": (e) => {
    $(e.currentTarget).parent(".card").removeClass("hovered");
  },
  "click .btnRefresh": function () {
    $(".fullScreenSpin").css("display", "inline-block");
    let templateObject = Template.instance();
    var currentBeginDate = new Date();
    var begunDate = moment(currentBeginDate).format("DD/MM/YYYY");
    let fromDateMonth = currentBeginDate.getMonth() + 1;
    let fromDateDay = currentBeginDate.getDate();
    if (currentBeginDate.getMonth() + 1 < 10) {
      fromDateMonth = "0" + (currentBeginDate.getMonth() + 1);
    } else {
      fromDateMonth = currentBeginDate.getMonth() + 1;
    }

    if (currentBeginDate.getDate() < 10) {
      fromDateDay = "0" + currentBeginDate.getDate();
    }
    var toDate = currentBeginDate.getFullYear() + "-" + fromDateMonth + "-" + fromDateDay;
    let prevMonth11Date = moment().subtract(reportsloadMonths, "months").format("YYYY-MM-DD");

      sideBarService.getAllPurchaseOrderListAll(prevMonth11Date,toDate,true,initialReportLoad,0).then(function (data) {
          addVS1Data("TbillReport", JSON.stringify(data)).then(function (datareturn) {
            sideBarService.getAllPurchasesList(prevMonth11Date,toDate,true,initialReportLoad,0).then(function (dataPList) {
                addVS1Data("TPurchasesList", JSON.stringify(dataPList)).then(function (datareturnPlist) {
                    window.open('/purchasesoverview', '_self');
                  }).catch(function (err) {
                    window.open('/purchasesoverview', '_self');
                  });
              }).catch(function (err) {
                window.open('/purchasesoverview', '_self');
              });
            }).catch(function (err) {
              sideBarService.getAllPurchasesList(prevMonth11Date,toDate,true,initialReportLoad,0).then(function (dataPList) {
                  addVS1Data("TPurchasesList", JSON.stringify(dataPList)).then(function (datareturnPlist) {
                      window.open('/purchasesoverview', '_self');
                    }).catch(function (err) {
                      window.open('/purchasesoverview', '_self');
                    });
                }).catch(function (err) {
                  window.open('/purchasesoverview', '_self');
                });
            });
        }).catch(function (err) {
          sideBarService.getAllPurchasesList(prevMonth11Date,toDate,true,initialReportLoad,0).then(function (dataPList) {
              addVS1Data("TPurchasesList", JSON.stringify(dataPList)).then(function (datareturnPlist) {
                  window.open("/purchasesoverview", "_self");
                }).catch(function (err) {
                  window.open("/purchasesoverview", "_self");
                });
            }).catch(function (err) {
              window.open("/purchasesoverview", "_self");
            });
        });

  },
  "change #dateTo": function () {
    let templateObject = Template.instance();
    $(".fullScreenSpin").css("display", "inline-block");
    $("#dateFrom").attr("readonly", false);
    $("#dateTo").attr("readonly", false);
    setTimeout(function(){
    var dateFrom = new Date($("#dateFrom").datepicker("getDate"));
    var dateTo = new Date($("#dateTo").datepicker("getDate"));

    let formatDateFrom =
      dateFrom.getFullYear() +
      "-" +
      (dateFrom.getMonth() + 1) +
      "-" +
      dateFrom.getDate();
    let formatDateTo =
      dateTo.getFullYear() +
      "-" +
      (dateTo.getMonth() + 1) +
      "-" +
      dateTo.getDate();

    //  templateObject.getAgedPayableReports(formatDateFrom,formatDateTo,false);
    var formatDate =
      dateTo.getDate() +
      "/" +
      (dateTo.getMonth() + 1) +
      "/" +
      dateTo.getFullYear();
    //templateObject.dateAsAt.set(formatDate);
    if (
      $("#dateFrom").val().replace(/\s/g, "") == "" &&
      $("#dateFrom").val().replace(/\s/g, "") == ""
    ) {
    } else {
      templateObject.getAllFilterPurchasesData(
        formatDateFrom,
        formatDateTo,
        false
      );
    }
    },500);
  },
  "change #dateFrom": function () {
    let templateObject = Template.instance();
    $(".fullScreenSpin").css("display", "inline-block");
    $("#dateFrom").attr("readonly", false);
    $("#dateTo").attr("readonly", false);
    setTimeout(function(){
    var dateFrom = new Date($("#dateFrom").datepicker("getDate"));
    var dateTo = new Date($("#dateTo").datepicker("getDate"));

    let formatDateFrom =
      dateFrom.getFullYear() +
      "-" +
      (dateFrom.getMonth() + 1) +
      "-" +
      dateFrom.getDate();
    let formatDateTo =
      dateTo.getFullYear() +
      "-" +
      (dateTo.getMonth() + 1) +
      "-" +
      dateTo.getDate();

    //  templateObject.getAgedPayableReports(formatDateFrom,formatDateTo,false);
    var formatDate =
      dateTo.getDate() +
      "/" +
      (dateTo.getMonth() + 1) +
      "/" +
      dateTo.getFullYear();
    //templateObject.dateAsAt.set(formatDate);
    if (
      $("#dateFrom").val().replace(/\s/g, "") == "" &&
      $("#dateFrom").val().replace(/\s/g, "") == ""
    ) {
    } else {
      templateObject.getAllFilterPurchasesData(
        formatDateFrom,
        formatDateTo,
        false
      );
    }
    },500);
  },
  "click #today": function () {
    let templateObject = Template.instance();
    $(".fullScreenSpin").css("display", "inline-block");
    $("#dateFrom").attr("readonly", false);
    $("#dateTo").attr("readonly", false);
    var currentBeginDate = new Date();
    var begunDate = moment(currentBeginDate).format("DD/MM/YYYY");
    let fromDateMonth = currentBeginDate.getMonth() + 1;
    let fromDateDay = currentBeginDate.getDate();
    if (currentBeginDate.getMonth() + 1 < 10) {
      fromDateMonth = "0" + (currentBeginDate.getMonth() + 1);
    } else {
      fromDateMonth = currentBeginDate.getMonth() + 1;
    }

    if (currentBeginDate.getDate() < 10) {
      fromDateDay = "0" + currentBeginDate.getDate();
    }
    var toDateERPFrom =
      currentBeginDate.getFullYear() + "-" + fromDateMonth + "-" + fromDateDay;
    var toDateERPTo =
      currentBeginDate.getFullYear() + "-" + fromDateMonth + "-" + fromDateDay;

    var toDateDisplayFrom =
      fromDateDay + "/" + fromDateMonth + "/" + currentBeginDate.getFullYear();
    var toDateDisplayTo =
      fromDateDay + "/" + fromDateMonth + "/" + currentBeginDate.getFullYear();

    $("#dateFrom").val(toDateDisplayFrom);
    $("#dateTo").val(toDateDisplayTo);
    templateObject.getAllFilterPurchasesData(toDateERPFrom, toDateERPTo, false);
  },
  "click #lastweek": function () {
    let templateObject = Template.instance();
    $(".fullScreenSpin").css("display", "inline-block");
    $("#dateFrom").attr("readonly", false);
    $("#dateTo").attr("readonly", false);
    var currentBeginDate = new Date();
    var begunDate = moment(currentBeginDate).format("DD/MM/YYYY");
    let fromDateMonth = currentBeginDate.getMonth() + 1;
    let fromDateDay = currentBeginDate.getDate();
    if (currentBeginDate.getMonth() + 1 < 10) {
      fromDateMonth = "0" + (currentBeginDate.getMonth() + 1);
    } else {
      fromDateMonth = currentBeginDate.getMonth() + 1;
    }

    if (currentBeginDate.getDate() < 10) {
      fromDateDay = "0" + currentBeginDate.getDate();
    }
    var toDateERPFrom =
      currentBeginDate.getFullYear() +
      "-" +
      fromDateMonth +
      "-" +
      (fromDateDay - 7);
    var toDateERPTo =
      currentBeginDate.getFullYear() + "-" + fromDateMonth + "-" + fromDateDay;

    var toDateDisplayFrom =
      fromDateDay -
      7 +
      "/" +
      fromDateMonth +
      "/" +
      currentBeginDate.getFullYear();
    var toDateDisplayTo =
      fromDateDay + "/" + fromDateMonth + "/" + currentBeginDate.getFullYear();

    $("#dateFrom").val(toDateDisplayFrom);
    $("#dateTo").val(toDateDisplayTo);
    templateObject.getAllFilterPurchasesData(toDateERPFrom, toDateERPTo, false);
  },
  "click #lastMonth": function () {
    let templateObject = Template.instance();
    $(".fullScreenSpin").css("display", "inline-block");
    $("#dateFrom").attr("readonly", false);
    $("#dateTo").attr("readonly", false);
    var currentDate = new Date();

    var prevMonthLastDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      0
    );
    var prevMonthFirstDate = new Date(
      currentDate.getFullYear() - (currentDate.getMonth() > 0 ? 0 : 1),
      (currentDate.getMonth() - 1 + 12) % 12,
      1
    );

    var formatDateComponent = function (dateComponent) {
      return (dateComponent < 10 ? "0" : "") + dateComponent;
    };

    var formatDate = function (date) {
      return (
        formatDateComponent(date.getDate()) +
        "/" +
        formatDateComponent(date.getMonth() + 1) +
        "/" +
        date.getFullYear()
      );
    };

    var formatDateERP = function (date) {
      return (
        date.getFullYear() +
        "-" +
        formatDateComponent(date.getMonth() + 1) +
        "-" +
        formatDateComponent(date.getDate())
      );
    };

    var fromDate = formatDate(prevMonthFirstDate);
    var toDate = formatDate(prevMonthLastDate);

    $("#dateFrom").val(fromDate);
    $("#dateTo").val(toDate);

    var getLoadDate = formatDateERP(prevMonthLastDate);
    let getDateFrom = formatDateERP(prevMonthFirstDate);
    templateObject.getAllFilterPurchasesData(getDateFrom, getLoadDate, false);
  },
  "click #lastQuarter": function () {
    let templateObject = Template.instance();
    $(".fullScreenSpin").css("display", "inline-block");
    $("#dateFrom").attr("readonly", false);
    $("#dateTo").attr("readonly", false);
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
      .subtract({
        months: quarterAdjustment,
      })
      .endOf("month");
    var lastQuarterStartDate = lastQuarterEndDate
      .clone()
      .subtract({
        months: 2,
      })
      .startOf("month");

    var lastQuarterStartDateFormat =
      moment(lastQuarterStartDate).format("DD/MM/YYYY");
    var lastQuarterEndDateFormat =
      moment(lastQuarterEndDate).format("DD/MM/YYYY");

    $("#dateFrom").val(lastQuarterStartDateFormat);
    $("#dateTo").val(lastQuarterEndDateFormat);

    let fromDateMonth = getQuarter(currentDate);
    var quarterMonth = getQuarter(currentDate);
    let fromDateDay = currentDate.getDate();

    var getLoadDate = moment(lastQuarterEndDate).format("YYYY-MM-DD");
    let getDateFrom = moment(lastQuarterStartDateFormat).format("YYYY-MM-DD");
    templateObject.getAllFilterPurchasesData(getDateFrom, getLoadDate, false);
  },
  "click #last12Months": function () {
    let templateObject = Template.instance();
    $(".fullScreenSpin").css("display", "inline-block");
    $("#dateFrom").attr("readonly", false);
    $("#dateTo").attr("readonly", false);
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
    $("#dateFrom").val(fromDate);
    $("#dateTo").val(begunDate);

    var currentDate2 = new Date();
    if (currentDate2.getMonth() + 1 < 10) {
      fromDateMonth2 = "0" + Math.floor(currentDate2.getMonth() + 1);
    }
    if (currentDate2.getDate() < 10) {
      fromDateDay2 = "0" + currentDate2.getDate();
    }
    var getLoadDate = moment(currentDate2).format("YYYY-MM-DD");
    let getDateFrom =
      Math.floor(currentDate2.getFullYear() - 1) +
      "-" +
      fromDateMonth2 +
      "-" +
      currentDate2.getDate();
    templateObject.getAllFilterPurchasesData(getDateFrom, getLoadDate, false);
  },

  "click #ignoreDate": function () {
    let templateObject = Template.instance();
    $(".fullScreenSpin").css("display", "inline-block");
    $("#dateFrom").attr("readonly", true);
    $("#dateTo").attr("readonly", true);
    templateObject.getAllFilterPurchasesData("", "", true);
  },
  "click #newPurchaseorder": function (event) {
    FlowRouter.go("/purchaseordercard");
  },
  "click .purchaseorderList": function (event) {
    FlowRouter.go("/purchaseorderlist");
  },
  "click .purchaseorderListBO": function (event) {
    FlowRouter.go("/purchaseorderlistBO");
  },
  "click #newBill": function (event) {
    FlowRouter.go("/billcard");
  },
  "click .billList": function (event) {
    FlowRouter.go("/billlist");
  },
  "click #newCredit": function (event) {
    FlowRouter.go("/creditcard");
  },
  "click .creditList": function (event) {
    FlowRouter.go("/creditlist");
  },
  "click .newpo": function (event) {
    FlowRouter.go("/purchaseordercard");
  },
  "click .cardBills": function (event) {
    FlowRouter.go("/billlist?overview=true");
  },
  "click .cardCredit": function (event) {
    FlowRouter.go("/creditlist?overview=true");
  },
  "click .cardOutPO": function (event) {
    FlowRouter.go("/purchaseorderlist?overview=true");
  },
  "click .newBill": function (event) {
    //FlowRouter.go('/creditcard');
  },
  "click .newCredit": function (event) {
    //FlowRouter.go('/creditcard');
  },
  "click .allList": function (event) {
    //FlowRouter.go('/purchasesoverview?id=all');
    let templateObject = Template.instance();
    $(".fullScreenSpin").css("display", "inline-block");
    $("#dateFrom").attr("readonly", true);
    $("#dateTo").attr("readonly", true);
    templateObject.getAllFilterPurchasesData("", "", true);
  },
  "click .chkDatatable": function (event) {
    var columns = $("#tblPurchaseOverview th");
    let columnDataValue = $(event.target)
      .closest("div")
      .find(".divcolumn")
      .text();

    $.each(columns, function (i, v) {
      let className = v.classList;
      let replaceClass = className[1];

      if (v.innerText == columnDataValue) {
        if ($(event.target).is(":checked")) {
          $("." + replaceClass + "").css("display", "table-cell");
          $("." + replaceClass + "").css("padding", ".75rem");
          $("." + replaceClass + "").css("vertical-align", "top");
        } else {
          $("." + replaceClass + "").css("display", "none");
        }
      }
    });
  },

  "click .resetTable": function (event) {
    let templateObject = Template.instance();
    let custFields = templateObject.custfields.get();
    // var datable = $('#tblSalesOverview').DataTable();

    let reset_data = [
      { label: 'Order Date', class: 'colOrderDate', active: true, width: 0 },
      { label: 'Order No.', class: 'colPurchaseNo', active: true, width: 0 },
      { label: 'Type', class: 'colType', active: true, width: 0 },
      { label: 'Supplier', class: 'colSupplier', active: true, width: 0 },
      { label: 'Amount(Ex)', class: 'colAmountEx', active: true, width: 0 },
      { label: 'Tax', class: 'colTax', active: true, width: 0 },
      { label: 'Amount', class: 'colAmount', active: true, width: 0 },
      // { label: 'Paid', class: 'colPaid', active: true, width: 0 },
      { label: 'Outstanding', class: 'colBalanceOutstanding', active: true, width: 0 },
      { label: 'Status', class: 'colStatus', active: true, width: 0 },
      { label: 'Phone', class: 'colPurchaseCustField1', active: false, width: 0 },
      { label: 'Invoice No.', class: 'colPurchaseCustField2', active: false, width: 0 },
      { label: 'Contact', class: 'colEmployee', active: false, width: 0 },
      { label: 'Comments', class: 'colComments', active: true, width: 0 },
      { label: custFields[0].custfieldlabel, class: 'colSaleCustField1', active: custFields[0].active, width: 0},
      { label: custFields[1].custfieldlabel, class: 'colSaleCustField2', active: custFields[1].active, width: 0},
      { label: custFields[2].custfieldlabel, class: 'colSaleCustField3', active: custFields[2].active, width: 0}
    ];


    $('.displaySettings').each(function(index) {
      var $tblrow = $(this);
      $tblrow.find(".divcolumn").text(reset_data[index].label);
      $tblrow.find(".custom-control-input").prop('checked', reset_data[index].active);

      // var title = datable.column( index+1 ).header();
      var title = $('#tblPurchaseOverview').find('th').eq(index + 1);
      $(title).html(reset_data[index].label);

      if (reset_data[index].active) {
        $('.' + reset_data[index].class).css('display', 'table-cell');
        $('.' + reset_data[index].class).css('padding', '.75rem');
        $('.' + reset_data[index].class).css('vertical-align', 'top');
      } else {
        $('.' + reset_data[index].class).css('display', 'none');
      }
    });

    // var getcurrentCloudDetails = CloudUser.findOne({
    //   _id: Session.get("mycloudLogonID"),
    //   clouddatabaseID: Session.get("mycloudLogonDBID"),
    // });
    // if (getcurrentCloudDetails) {
    //   if (getcurrentCloudDetails._id.length > 0) {
    //     var clientID = getcurrentCloudDetails._id;
    //     var clientUsername = getcurrentCloudDetails.cloudUsername;
    //     var clientEmail = getcurrentCloudDetails.cloudEmail;
    //     var checkPrefDetails = CloudPreference.findOne({
    //       userid: clientID,
    //       PrefName: "tblPurchaseOverview",
    //     });
    //     if (checkPrefDetails) {
    //       CloudPreference.remove(
    //         {
    //           _id: checkPrefDetails._id,
    //         },
    //         function (err, idTag) {
    //           if (err) {
    //           } else {
    //             Meteor._reload.reload();
    //           }
    //         }
    //       );
    //     }
    //   }
    // }
  },


  "click .saveTable": function (event) {
    let lineItems = [];
    let organisationService = new OrganisationService();
    let listType = "ltPurchaseOverview";

    $(".fullScreenSpin").css("display", "inline-block");

    $('.displaySettings').each(function(index) {
      var $tblrow = $(this);
      var fieldID = $tblrow.attr("custid") || 0;
      var colTitle = $tblrow.find(".divcolumn").text() || '';
      var colWidth = $tblrow.find(".custom-range").val() || 0;
      var colthClass = $tblrow.find(".divcolumn").attr("valueupdate") || '';
      var colHidden = false;
      if ($tblrow.find(".custom-control-input").is(':checked')) {
          colHidden = true;
      } else {
          colHidden = false;
      }
      let lineItemObj = {
          index: index,
          label: colTitle,
          hidden: colHidden,
          width: colWidth,
          thclass: colthClass
      }

      lineItems.push(lineItemObj);

      if(fieldID && parseInt(fieldID) != 0){
        objDetails1 = {
          type: "TCustomFieldList",
          fields: {
            Active: colHidden,
            ID: parseInt(fieldID),
            Description: colTitle,
            Width: colWidth
          },
        };
      } else {
        objDetails1 = {
          type: "TCustomFieldList",
          fields: {
            Active: colHidden,
            DataType: "ftString",
            Description: colTitle,
            ListType: listType,
            Width: colWidth
          },
        };
      }

      organisationService.saveCustomField(objDetails1).then(function (objDetails) {
        $(".fullScreenSpin").css("display", "none");
        $('#myModal2').modal('hide');
      })
      .catch(function (err) {
        swal({
          title: "Oooops...",
          text: err,
          type: "error",
          showCancelButton: false,
          confirmButtonText: "Try Again",
        }).then((result) => {
          if (result.value) {
            $(".fullScreenSpin").css("display", "none");
          } else if (result.dismiss === "cancel") {
          }
          $('#myModal2').modal('hide');
        });
        $(".fullScreenSpin").css("display", "none");
        $('#myModal2').modal('hide');
      });
    });

    setTimeout(() => {
      sideBarService.getAllCustomFieldsWithQuery(listType).then(function (data) {
        addVS1Data("TltPurchaseOverview", JSON.stringify(data));
      });
    }, 8000);

  },

  // "click .saveTable": function (event) {
  //   let lineItems = [];
  //   //let datatable =$('#tblPurchaseOverview').DataTable();
  //   $(".columnSettings").each(function (index) {
  //     var $tblrow = $(this);
  //     var colTitle = $tblrow.find(".divcolumn").text() || "";
  //     var colWidth = $tblrow.find(".custom-range").val() || 0;
  //     var colthClass = $tblrow.find(".divcolumn").attr("valueupdate") || "";
  //     var colHidden = false;
  //     if ($tblrow.find(".custom-control-input").is(":checked")) {
  //       colHidden = false;
  //     } else {
  //       colHidden = true;
  //     }
  //     let lineItemObj = {
  //       index: index,
  //       label: colTitle,
  //       hidden: colHidden,
  //       width: colWidth,
  //       thclass: colthClass,
  //     };

  //     lineItems.push(lineItemObj);
  //   });
  //   //datatable.state.save();

  //   var getcurrentCloudDetails = CloudUser.findOne({
  //     _id: Session.get("mycloudLogonID"),
  //     clouddatabaseID: Session.get("mycloudLogonDBID"),
  //   });
  //   if (getcurrentCloudDetails) {
  //     if (getcurrentCloudDetails._id.length > 0) {
  //       var clientID = getcurrentCloudDetails._id;
  //       var clientUsername = getcurrentCloudDetails.cloudUsername;
  //       var clientEmail = getcurrentCloudDetails.cloudEmail;
  //       var checkPrefDetails = CloudPreference.findOne({
  //         userid: clientID,
  //         PrefName: "tblPurchaseOverview",
  //       });
  //       if (checkPrefDetails) {
  //         CloudPreference.update(
  //           {
  //             _id: checkPrefDetails._id,
  //           },
  //           {
  //             $set: {
  //               userid: clientID,
  //               username: clientUsername,
  //               useremail: clientEmail,
  //               PrefGroup: "salesform",
  //               PrefName: "tblPurchaseOverview",
  //               published: true,
  //               customFields: lineItems,
  //               updatedAt: new Date(),
  //             },
  //           },
  //           function (err, idTag) {
  //             if (err) {
  //               $("#myModal2").modal("toggle");
  //             } else {
  //               $("#myModal2").modal("toggle");
  //             }
  //           }
  //         );
  //       } else {
  //         CloudPreference.insert(
  //           {
  //             userid: clientID,
  //             username: clientUsername,
  //             useremail: clientEmail,
  //             PrefGroup: "salesform",
  //             PrefName: "tblPurchaseOverview",
  //             published: true,
  //             customFields: lineItems,
  //             createdAt: new Date(),
  //           },
  //           function (err, idTag) {
  //             if (err) {
  //               $("#myModal2").modal("toggle");
  //             } else {
  //               $("#myModal2").modal("toggle");
  //             }
  //           }
  //         );
  //       }
  //     }
  //   }
  //   $("#myModal2").modal("toggle");
  // },
  "blur .divcolumn": function (event) {
    let columData = $(event.target).text();

    let columnDatanIndex = $(event.target)
      .closest("div.columnSettings")
      .attr("id");

    var datable = $("#tblPurchaseOverview").DataTable();
    var title = datable.column(columnDatanIndex).header();
    $(title).html(columData);
  },
  "change .rngRange": function (event) {
    let range = $(event.target).val();
    // $(event.target).closest("div.divColWidth").find(".spWidth").html(range+'px');

    // let columData = $(event.target).closest("div.divColWidth").find(".spWidth").attr("value");
    let columnDataValue = $(event.target)
      .closest("div")
      .prev()
      .find(".divcolumn")
      .text();
    var datable = $("#tblPurchaseOverview th");
    $.each(datable, function (i, v) {
      if (v.innerText == columnDataValue) {
        let className = v.className;
        let replaceClass = className.replace(/ /g, ".");
        $("." + replaceClass + "").css("width", range + "px");
      }
    });
  },
  "click .btnOpenSettings": function (event) {
    let templateObject = Template.instance();
    var columns = $("#tblPurchaseOverview th");

    const tableHeaderList = [];
    let sTible = "";
    let sWidth = "";
    let sIndex = "";
    let sVisible = "";
    let columVisible = false;
    let sClass = "";
    $.each(columns, function (i, v) {
      if (v.hidden == false) {
        columVisible = true;
      }
      if (v.className.includes("hiddenColumn")) {
        columVisible = false;
      }
      sWidth = v.style.width.replace("px", "");

      let datatablerecordObj = {
        custid: $(this).attr("custid") || 0,
        sTitle: v.innerText || "",
        sWidth: sWidth || "",
        sIndex: v.cellIndex || "",
        sVisible: columVisible || false,
        sClass: v.className || "",
      };
      tableHeaderList.push(datatablerecordObj);
    });

    templateObject.tableheaderrecords.set(tableHeaderList);
  },
  "click #exportbtn": function () {
    $(".fullScreenSpin").css("display", "inline-block");
    jQuery("#tblPurchaseOverview_wrapper .dt-buttons .btntabletocsv").click();
    $(".fullScreenSpin").css("display", "none");
  },
  "click .printConfirm": function (event) {
    $(".fullScreenSpin").css("display", "inline-block");
    jQuery("#tblPurchaseOverview_wrapper .dt-buttons .btntabletopdf").click();
    $(".fullScreenSpin").css("display", "none");
  },
});
Template.purchasesoverview.helpers({
  datatablerecords: () => {
    return Template.instance()
      .datatablerecords.get()
      .sort(function (a, b) {
        if (a.orderdate == "NA") {
          return 1;
        } else if (b.orderdate == "NA") {
          return -1;
        }
        return a.orderdate.toUpperCase() > b.orderdate.toUpperCase() ? 1 : -1;
      });
  },
  tableheaderrecords: () => {
    return Template.instance().tableheaderrecords.get();
  },
  purchasesCloudPreferenceRec: () => {
    return CloudPreference.findOne({
      userid: Session.get("mycloudLogonID"),
      PrefName: "tblPurchaseOverview",
    });
  },
  creditpercTotal: () => {
    return Template.instance().creditpercTotal.get() || 0;
  },
  billpercTotal: () => {
    return Template.instance().billpercTotal.get() || 0;
  },
  popercTotal: () => {
    return Template.instance().popercTotal.get() || 0;
  },
  loggedCompany: () => {
    return localStorage.getItem("mySession") || "";
  },

  // custom fields displaysettings
  custfields: () => {
    return Template.instance().custfields.get();
  },

  // custom fields displaysettings
  displayfields: () => {
    return Template.instance().displayfields.get();
  },
});
