import { PurchaseBoardService } from "../js/purchase-service";
import { ReactiveVar } from "meteor/reactive-var";
// import { CoreService } from "../js/core-service";
// import { EmployeeProfileService } from "../js/profile-service";
import { AccountService } from "../accounts/account-service";
import { UtilityService } from "../utility-service";
import { SideBarService } from "../js/sidebar-service";
import "../lib/global/indexdbstorage.js";
import {OrganisationService} from '../js/organisation-service';

let sideBarService = new SideBarService();
let utilityService = new UtilityService();
Template.purchaseorderlist.onCreated(function () {
  const templateObject = Template.instance();
  templateObject.datatablerecords = new ReactiveVar([]);
  templateObject.tableheaderrecords = new ReactiveVar([]);
  templateObject.custfields = new ReactiveVar([]);
  templateObject.displayfields = new ReactiveVar([]);
});

Template.purchaseorderlist.onRendered(function () {
  $(".fullScreenSpin").css("display", "inline-block");
  let templateObject = Template.instance();
  let accountService = new AccountService();
  let purchaseService = new PurchaseBoardService();
  const supplierList = [];
  let purchaseOrderTable;
  var splashArray = new Array();
  const dataTableList = [];
  const tableHeaderList = [];

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

  if (FlowRouter.current().queryParams.success) {
    $(".btnRefresh").addClass("btnRefreshAlert");
  }

  function MakeNegative() {
    $("td").each(function () {
      if (
        $(this)
          .text()
          .indexOf("-" + Currency) >= 0
      )
        $(this).addClass("text-danger");
    });

    $("td.colStatus").each(function () {
      if ($(this).text() == "Deleted") $(this).addClass("text-deleted");
    });
  }

  templateObject.resetData = function (dataVal) {
    location.reload();
  };

  templateObject.getAllPurchaseOrderData = function () {
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
    var toDate =
      currentBeginDate.getFullYear() + "-" + fromDateMonth + "-" + fromDateDay;
    let prevMonth11Date = moment()
      .subtract(reportsloadMonths, "months")
      .format("YYYY-MM-DD");

    getVS1Data("TPurchaseOrderList").then(function (dataObject) {
        if (dataObject.length == 0) {
          sideBarService
            .getAllTPurchaseOrderListData(
              prevMonth11Date,
              toDate,
              true,
              initialReportLoad,
              0
            )
            .then(function (data) {
              let lineItems = [];
              let lineItemObj = {};
              addVS1Data("TPurchaseOrderList", JSON.stringify(data));
              if (data.Params.IgnoreDates == true) {
                $("#dateFrom").attr("readonly", true);
                $("#dateTo").attr("readonly", true);

              } else {
                $("#dateFrom").attr("readonly", false);
                $("#dateTo").attr("readonly", false);
                $("#dateFrom").val(
                  data.Params.DateFrom != ""
                    ? moment(data.Params.DateFrom).format("DD/MM/YYYY")
                    : data.Params.DateFrom
                );
                $("#dateTo").val(
                  data.Params.DateTo != ""
                    ? moment(data.Params.DateTo).format("DD/MM/YYYY")
                    : data.Params.DateTo
                );
              }
              for (let i = 0; i < data.tpurchaseorderlist.length; i++) {
                let totalAmountEx =
                  utilityService.modifynegativeCurrencyFormat(
                    data.tpurchaseorderlist[i].TotalAmount
                  ) || 0.0;
                let totalTax =
                  utilityService.modifynegativeCurrencyFormat(
                    data.tpurchaseorderlist[i].TotalTax
                  ) || 0.0;
                let totalAmount =
                  utilityService.modifynegativeCurrencyFormat(
                    data.tpurchaseorderlist[i].TotalAmountInc
                  ) || 0.0;
                let totalPaid =
                  utilityService.modifynegativeCurrencyFormat(
                    data.tpurchaseorderlist[i].Payment
                  ) || 0.0;
                let totalOutstanding =
                  utilityService.modifynegativeCurrencyFormat(
                    data.tpurchaseorderlist[i].Balance
                  ) || 0.0;
                let orderstatus = data.tpurchaseorderlist[i].OrderStatus || "";
                if (data.tpurchaseorderlist[i].Deleted == true) {
                  orderstatus = "Deleted";
                }else if(data.tpurchaseorderlist[i].SupplierName == ''){
                  orderstatus = "Deleted";
                };
                var dataList = {
                  id: data.tpurchaseorderlist[i].PurchaseOrderID || "",
                  employee: data.tpurchaseorderlist[i].EmployeeName || "",
                  sortdate:
                    data.tpurchaseorderlist[i].OrderDate != ""
                      ? moment(data.tpurchaseorderlist[i].OrderDate).format(
                          "YYYY/MM/DD"
                        )
                      : data.tpurchaseorderlist[i].OrderDate,
                  orderdate:
                    data.tpurchaseorderlist[i].OrderDate != ""
                      ? moment(data.tpurchaseorderlist[i].OrderDate).format(
                          "DD/MM/YYYY"
                        )
                      : data.tpurchaseorderlist[i].OrderDate,
                  suppliername: data.tpurchaseorderlist[i].SupplierName || "",
                  totalamountex: totalAmountEx || 0.0,
                  totaltax: totalTax || 0.0,
                  totalamount: totalAmount || 0.0,
                  totalpaid: totalPaid || 0.0,
                  totaloustanding: totalOutstanding || 0.0,
                  orderstatus: orderstatus || "",
                  custfield1: data.tpurchaseorderlist[i].SaleCustField1 || '',
                  custfield2: "" || "",
                  custfield3: "" || "",
                  comments: data.tpurchaseorderlist[i].Comments || "",
                };
                //if(data.tpurchaseorderlist[i].Deleted === false && data.tpurchaseorderlist[i].SupplierName.replace(/\s/g, '') != ''){
                dataTableList.push(dataList);
                //}
                // dataTableList.push(dataList);
              }
              templateObject.datatablerecords.set(dataTableList);

              if (templateObject.datatablerecords.get()) {
                Meteor.call(
                  "readPrefMethod",
                  Session.get("mycloudLogonID"),
                  "tblpurchaseorderlist",
                  function (error, result) {
                    if (error) {
                    } else {
                      if (result) {
                        for (let i = 0; i < result.customFields.length; i++) {
                          let customcolumn = result.customFields;
                          let columData = customcolumn[i].label;
                          let columHeaderUpdate = customcolumn[
                            i
                          ].thclass.replace(/ /g, ".");
                          let hiddenColumn = customcolumn[i].hidden;
                          let columnClass = columHeaderUpdate.split(".")[1];
                          let columnWidth = customcolumn[i].width;
                          let columnindex = customcolumn[i].index + 1;

                          if (hiddenColumn == true) {
                            $("." + columnClass + "").addClass("hiddenColumn");
                            $("." + columnClass + "").removeClass("showColumn");
                          } else if (hiddenColumn == false) {
                            $("." + columnClass + "").removeClass(
                              "hiddenColumn"
                            );
                            $("." + columnClass + "").addClass("showColumn");
                          }
                        }
                      }
                    }
                  }
                );

                setTimeout(function () {
                  MakeNegative();
                }, 100);
              }

              setTimeout(function () {
                //$.fn.dataTable.moment('DD/MM/YY');
                $("#tblpurchaseorderlist")
                  .DataTable({
                    columnDefs: [{ type: "date", targets: 0 }],
                    sDom: "<'row'><'row'<'col-sm-12 col-md-6'f><'col-sm-12 col-md-6 colDateFilter'l>r>t<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>B",
                    buttons: [
                      {
                        extend: "excelHtml5",
                        text: "",
                        download: "open",
                        className: "btntabletocsv hiddenColumn",
                        filename: "Purchase Order List - " + moment().format(),
                        orientation: "portrait",
                        exportOptions: {
                          columns: ":visible",
                          format: {
                            body: function (data, row, column) {
                              if (data.includes("</span>")) {
                                var res = data.split("</span>");
                                data = res[1];
                              }

                              return column === 1
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
                        title: "Purchase Order List",
                        filename: "Purchase Order List - " + moment().format(),
                        exportOptions: {
                          columns: ":visible",
                          stripHtml: false,
                        },
                      },
                    ],
                    select: true,
                    destroy: true,
                    colReorder: true,
                    // bStateSave: true,
                    // rowId: 0,
                    pageLength: initialReportDatatableLoad,
                    bLengthChange: false,
                    info: true,
                    responsive: true,
                    order: [
                      [0, "desc"],
                      [2, "desc"],
                    ],
                    action: function () {
                      $("#tblpurchaseorderlist").DataTable().ajax.reload();
                    },
                    fnDrawCallback: function (oSettings) {
                      let checkurlIgnoreDate =
                        FlowRouter.current().queryParams.ignoredate;

                      $(".paginate_button.page-item").removeClass("disabled");
                      $("#tblpurchaseorderlist_ellipsis").addClass("disabled");

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
                        $(".paginate_button.page-item.next").addClass(
                          "disabled"
                        );
                      }

                      $(
                        ".paginate_button.next:not(.disabled)",
                        this.api().table().container()
                      ).on("click", function () {
                        $(".fullScreenSpin").css("display", "inline-block");
                        let dataLenght = oSettings._iDisplayLength;

                        var dateFrom = new Date(
                          $("#dateFrom").datepicker("getDate")
                        );
                        var dateTo = new Date(
                          $("#dateTo").datepicker("getDate")
                        );

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

                        if(data.Params.IgnoreDates == true){
                          sideBarService
                            .getAllTPurchaseOrderListData(
                              formatDateFrom,
                              formatDateTo,
                              true,
                              initialDatatableLoad,
                              oSettings.fnRecordsDisplay()
                            )
                            .then(function (dataObjectnew) {
                              getVS1Data("TPurchaseOrderList")
                                .then(function (dataObjectold) {
                                  if (dataObjectold.length == 0) {
                                  } else {
                                    let dataOld = JSON.parse(
                                      dataObjectold[0].data
                                    );

                                    var thirdaryData = $.merge(
                                      $.merge(
                                        [],
                                        dataObjectnew.tpurchaseorderlist
                                      ),
                                      dataOld.tpurchaseorderlist
                                    );
                                    let objCombineData = {
                                      Params: dataOld.Params,
                                      tpurchaseorderlist: thirdaryData,
                                    };

                                    addVS1Data(
                                      "TPurchaseOrderList",
                                      JSON.stringify(objCombineData)
                                    )
                                      .then(function (datareturn) {
                                        templateObject.resetData(
                                          objCombineData
                                        );
                                        $(".fullScreenSpin").css(
                                          "display",
                                          "none"
                                        );
                                      })
                                      .catch(function (err) {
                                        $(".fullScreenSpin").css(
                                          "display",
                                          "none"
                                        );
                                      });
                                  }
                                })
                                .catch(function (err) {});
                            })
                            .catch(function (err) {
                              $(".fullScreenSpin").css("display", "none");
                            });
                        } else {
                          sideBarService
                            .getAllTPurchaseOrderListData(
                              formatDateFrom,
                              formatDateTo,
                              false,
                              initialDatatableLoad,
                              oSettings.fnRecordsDisplay()
                            )
                            .then(function (dataObjectnew) {
                              getVS1Data("TPurchaseOrderList")
                                .then(function (dataObjectold) {
                                  if (dataObjectold.length == 0) {
                                  } else {
                                    let dataOld = JSON.parse(
                                      dataObjectold[0].data
                                    );

                                    var thirdaryData = $.merge(
                                      $.merge(
                                        [],
                                        dataObjectnew.tpurchaseorderlist
                                      ),
                                      dataOld.tpurchaseorderlist
                                    );
                                    let objCombineData = {
                                      Params: dataOld.Params,
                                      tpurchaseorderlist: thirdaryData,
                                    };

                                    addVS1Data(
                                      "TPurchaseOrderList",
                                      JSON.stringify(objCombineData)
                                    )
                                      .then(function (datareturn) {
                                        templateObject.resetData(
                                          objCombineData
                                        );
                                        $(".fullScreenSpin").css(
                                          "display",
                                          "none"
                                        );
                                      })
                                      .catch(function (err) {
                                        $(".fullScreenSpin").css(
                                          "display",
                                          "none"
                                        );
                                      });
                                  }
                                })
                                .catch(function (err) {});
                            })
                            .catch(function (err) {
                              $(".fullScreenSpin").css("display", "none");
                            });
                        }
                      });

                      setTimeout(function () {
                        MakeNegative();
                      }, 100);
                    },
                    fnInitComplete: function () {
                      this.fnPageChange("last");
                      $(
                        "<button class='btn btn-primary btnRefreshPOList' type='button' id='btnRefreshPOList' style='padding: 4px 10px; font-size: 14px; margin-left: 8px !important;'><i class='fas fa-search-plus' style='margin-right: 5px'></i>Search</button>"
                      ).insertAfter("#tblpurchaseorderlist_filter");
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
                    let draftRecord = templateObject.datatablerecords.get();
                    templateObject.datatablerecords.set(draftRecord);
                  })
                  .on("column-reorder", function () {})
                  .on("length.dt", function (e, settings, len) {
                    setTimeout(function () {
                      MakeNegative();
                    }, 100);
                  });
                $(".fullScreenSpin").css("display", "none");
              }, 0);

              var columns = $("#tblpurchaseorderlist th");
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
              $("div.dataTables_filter input").addClass(
                "form-control form-control-sm"
              );
              $("#tblpurchaseorderlist tbody").on("click", "tr", function () {
                var listData = $(this).closest("tr").attr("id");
                var checkDeleted =
                  $(this).closest("tr").find(".colStatus").text() || "";
                if (listData) {
                  if (checkDeleted == "Deleted") {
                    swal(
                      "You Cannot View This Transaction",
                      "Because It Has Been Deleted",
                      "info"
                    );
                  } else {
                    FlowRouter.go("/purchaseordercard?id=" + listData);
                  }
                }
              });
              templateObject.getCustomFieldData();
            })
            .catch(function (err) {
              // Bert.alert('<strong>' + err + '</strong>!', 'danger');
              $(".fullScreenSpin").css("display", "none");
              // Meteor._reload.reload();
            });
        } else {
          let data = JSON.parse(dataObject[0].data);
          let useData = data.tpurchaseorderlist;
          let lineItems = [];
          let lineItemObj = {};
          if (data.Params.IgnoreDates == true) {
            $("#dateFrom").attr("readonly", true);
            $("#dateTo").attr("readonly", true);

          } else {
            $("#dateFrom").attr("readonly", false);
            $("#dateTo").attr("readonly", false);
            $("#dateFrom").val(
              data.Params.DateFrom != ""
                ? moment(data.Params.DateFrom).format("DD/MM/YYYY")
                : data.Params.DateFrom
            );
            $("#dateTo").val(
              data.Params.DateTo != ""
                ? moment(data.Params.DateTo).format("DD/MM/YYYY")
                : data.Params.DateTo
            );
          }
          for (let i = 0; i < data.tpurchaseorderlist.length; i++) {
            let totalAmountEx =
              utilityService.modifynegativeCurrencyFormat(
                data.tpurchaseorderlist[i].TotalAmount
              ) || 0.0;
            let totalTax =
              utilityService.modifynegativeCurrencyFormat(
                data.tpurchaseorderlist[i].TotalTax
              ) || 0.0;
            let totalAmount =
              utilityService.modifynegativeCurrencyFormat(
                data.tpurchaseorderlist[i].TotalAmountInc
              ) || 0.0;
            let totalPaid =
              utilityService.modifynegativeCurrencyFormat(
                data.tpurchaseorderlist[i].Payment
              ) || 0.0;
            let totalOutstanding =
              utilityService.modifynegativeCurrencyFormat(
                data.tpurchaseorderlist[i].Balance
              ) || 0.0;
            let orderstatus = data.tpurchaseorderlist[i].OrderStatus || "";
            if (data.tpurchaseorderlist[i].Deleted == true) {
              orderstatus = "Deleted";
            }else if(data.tpurchaseorderlist[i].SupplierName == ''){
              orderstatus = "Deleted";
            };
            var dataList = {
              id: data.tpurchaseorderlist[i].PurchaseOrderID || "",
              employee: data.tpurchaseorderlist[i].EmployeeName || "",
              sortdate:
                data.tpurchaseorderlist[i].OrderDate != ""
                  ? moment(data.tpurchaseorderlist[i].OrderDate).format(
                      "YYYY/MM/DD"
                    )
                  : data.tpurchaseorderlist[i].OrderDate,
              orderdate:
                data.tpurchaseorderlist[i].OrderDate != ""
                  ? moment(data.tpurchaseorderlist[i].OrderDate).format(
                      "DD/MM/YYYY"
                    )
                  : data.tpurchaseorderlist[i].OrderDate,
              suppliername: data.tpurchaseorderlist[i].SupplierName || "",
              totalamountex: totalAmountEx || 0.0,
              totaltax: totalTax || 0.0,
              totalamount: totalAmount || 0.0,
              totalpaid: totalPaid || 0.0,
              totaloustanding: totalOutstanding || 0.0,
              orderstatus: orderstatus || "",
              custfield1: "" || "",
              custfield2: "" || "",
              custfield3: "" || "",
              comments: data.tpurchaseorderlist[i].Comments || "",
            };
            //if(data.tpurchaseorderlist[i].Deleted === false && data.tpurchaseorderlist[i].SupplierName.replace(/\s/g, '') != ''){
            dataTableList.push(dataList);
            //}
            // dataTableList.push(dataList);
          }
          templateObject.datatablerecords.set(dataTableList);

          if (templateObject.datatablerecords.get()) {
            Meteor.call(
              "readPrefMethod",
              Session.get("mycloudLogonID"),
              "tblpurchaseorderlist",
              function (error, result) {
                if (error) {
                } else {
                  if (result) {
                    for (let i = 0; i < result.customFields.length; i++) {
                      let customcolumn = result.customFields;
                      let columData = customcolumn[i].label;
                      let columHeaderUpdate = customcolumn[i].thclass.replace(
                        / /g,
                        "."
                      );
                      let hiddenColumn = customcolumn[i].hidden;
                      let columnClass = columHeaderUpdate.split(".")[1];
                      let columnWidth = customcolumn[i].width;
                      let columnindex = customcolumn[i].index + 1;

                      if (hiddenColumn == true) {
                        $("." + columnClass + "").addClass("hiddenColumn");
                        $("." + columnClass + "").removeClass("showColumn");
                      } else if (hiddenColumn == false) {
                        $("." + columnClass + "").removeClass("hiddenColumn");
                        $("." + columnClass + "").addClass("showColumn");
                      }
                    }
                  }
                }
              }
            );

            setTimeout(function () {
              MakeNegative();
            }, 100);
          }

          setTimeout(function () {
            //$.fn.dataTable.moment('DD/MM/YY');
            $("#tblpurchaseorderlist")
              .DataTable({
                columnDefs: [{ type: "date", targets: 0 }],
                sDom: "<'row'><'row'<'col-sm-12 col-md-6'f><'col-sm-12 col-md-6 colDateFilter'l>r>t<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>B",
                buttons: [
                  {
                    extend: "excelHtml5",
                    text: "",
                    download: "open",
                    className: "btntabletocsv hiddenColumn",
                    filename: "Purchase Order List - " + moment().format(),
                    orientation: "portrait",
                    exportOptions: {
                      columns: ":visible",
                      format: {
                        body: function (data, row, column) {
                          if (data.includes("</span>")) {
                            var res = data.split("</span>");
                            data = res[1];
                          }

                          return column === 1
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
                    title: "Purchase Order List",
                    filename: "Purchase Order List - " + moment().format(),
                    exportOptions: {
                      columns: ":visible",
                      stripHtml: false,
                    },
                  },
                ],
                select: true,
                destroy: true,
                colReorder: true,
                // bStateSave: true,
                // rowId: 0,
                pageLength: initialReportDatatableLoad,
                bLengthChange: false,
                info: true,
                responsive: true,
                order: [
                  [0, "desc"],
                  [2, "desc"],
                ],
                action: function () {
                  $("#tblpurchaseorderlist").DataTable().ajax.reload();
                },
                fnDrawCallback: function (oSettings) {
                  let checkurlIgnoreDate =
                    FlowRouter.current().queryParams.ignoredate;

                  $(".paginate_button.page-item").removeClass("disabled");
                  $("#tblpurchaseorderlist_ellipsis").addClass("disabled");

                  if (oSettings._iDisplayLength == -1) {
                    if (oSettings.fnRecordsDisplay() > 150) {
                      $(".paginate_button.page-item.previous").addClass(
                        "disabled"
                      );
                      $(".paginate_button.page-item.next").addClass("disabled");
                    }
                  } else {
                  }
                  if (oSettings.fnRecordsDisplay() < initialDatatableLoad) {
                    $(".paginate_button.page-item.next").addClass("disabled");
                  }

                  $(
                    ".paginate_button.next:not(.disabled)",
                    this.api().table().container()
                  ).on("click", function () {
                    $(".fullScreenSpin").css("display", "inline-block");
                    let dataLenght = oSettings._iDisplayLength;

                    var dateFrom = new Date(
                      $("#dateFrom").datepicker("getDate")
                    );
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

                  if(data.Params.IgnoreDates == true){
                      sideBarService
                        .getAllTPurchaseOrderListData(
                          formatDateFrom,
                          formatDateTo,
                          true,
                          initialDatatableLoad,
                          oSettings.fnRecordsDisplay()
                        )
                        .then(function (dataObjectnew) {
                          getVS1Data("TPurchaseOrderList")
                            .then(function (dataObjectold) {
                              if (dataObjectold.length == 0) {
                              } else {
                                let dataOld = JSON.parse(dataObjectold[0].data);

                                var thirdaryData = $.merge(
                                  $.merge([], dataObjectnew.tpurchaseorderlist),
                                  dataOld.tpurchaseorderlist
                                );
                                let objCombineData = {
                                  Params: dataOld.Params,
                                  tpurchaseorderlist: thirdaryData,
                                };

                                addVS1Data(
                                  "TPurchaseOrderList",
                                  JSON.stringify(objCombineData)
                                )
                                  .then(function (datareturn) {
                                    templateObject.resetData(objCombineData);
                                    $(".fullScreenSpin").css("display", "none");
                                  })
                                  .catch(function (err) {
                                    $(".fullScreenSpin").css("display", "none");
                                  });
                              }
                            })
                            .catch(function (err) {});
                        })
                        .catch(function (err) {
                          $(".fullScreenSpin").css("display", "none");
                        });
                    } else {
                      sideBarService
                        .getAllTPurchaseOrderListData(
                          formatDateFrom,
                          formatDateTo,
                          false,
                          initialDatatableLoad,
                          oSettings.fnRecordsDisplay()
                        )
                        .then(function (dataObjectnew) {
                          getVS1Data("TPurchaseOrderList")
                            .then(function (dataObjectold) {
                              if (dataObjectold.length == 0) {
                              } else {
                                let dataOld = JSON.parse(dataObjectold[0].data);

                                var thirdaryData = $.merge(
                                  $.merge([], dataObjectnew.tpurchaseorderlist),
                                  dataOld.tpurchaseorderlist
                                );
                                let objCombineData = {
                                  Params: dataOld.Params,
                                  tpurchaseorderlist: thirdaryData,
                                };

                                addVS1Data(
                                  "TPurchaseOrderList",
                                  JSON.stringify(objCombineData)
                                )
                                  .then(function (datareturn) {
                                    templateObject.resetData(objCombineData);
                                    $(".fullScreenSpin").css("display", "none");
                                  })
                                  .catch(function (err) {
                                    $(".fullScreenSpin").css("display", "none");
                                  });
                              }
                            })
                            .catch(function (err) {});
                        })
                        .catch(function (err) {
                          $(".fullScreenSpin").css("display", "none");
                        });
                    }
                  });

                  setTimeout(function () {
                    MakeNegative();
                  }, 100);
                },
                fnInitComplete: function () {
                  this.fnPageChange("last");
                  $(
                    "<button class='btn btn-primary btnRefreshPOList' type='button' id='btnRefreshPOList' style='padding: 4px 10px; font-size: 14px; margin-left: 8px !important;'><i class='fas fa-search-plus' style='margin-right: 5px'></i>Search</button>"
                  ).insertAfter("#tblpurchaseorderlist_filter");
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
                let draftRecord = templateObject.datatablerecords.get();
                templateObject.datatablerecords.set(draftRecord);
              })
              .on("column-reorder", function () {})
              .on("length.dt", function (e, settings, len) {
                setTimeout(function () {
                  MakeNegative();
                }, 100);
              });
            $(".fullScreenSpin").css("display", "none");
          }, 0);

          var columns = $("#tblpurchaseorderlist th");
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
          $("div.dataTables_filter input").addClass(
            "form-control form-control-sm"
          );
          $("#tblpurchaseorderlist tbody").on("click", "tr", function () {
            var listData = $(this).closest("tr").attr("id");
            var checkDeleted =
              $(this).closest("tr").find(".colStatus").text() || "";
            if (listData) {
              if (checkDeleted == "Deleted") {
                swal(
                  "You Cannot View This Transaction",
                  "Because It Has Been Deleted",
                  "info"
                );
              } else {
                FlowRouter.go("/purchaseordercard?id=" + listData);
              }
            }
          });

          templateObject.getCustomFieldData();
        }
      }).catch(function (err) {
        sideBarService.getAllTPurchaseOrderListData(
            prevMonth11Date,
            toDate,
            true,
            initialReportLoad,
            0
          )
          .then(function (data) {
            let lineItems = [];
            let lineItemObj = {};
            addVS1Data("TPurchaseOrderList", JSON.stringify(data));
            if (data.Params.IgnoreDates == true) {
              $("#dateFrom").attr("readonly", true);
              $("#dateTo").attr("readonly", true);
            } else {
              $("#dateFrom").attr("readonly", false);
              $("#dateTo").attr("readonly", false);
              $("#dateFrom").val(
                data.Params.DateFrom != ""
                  ? moment(data.Params.DateFrom).format("DD/MM/YYYY")
                  : data.Params.DateFrom
              );
              $("#dateTo").val(
                data.Params.DateTo != ""
                  ? moment(data.Params.DateTo).format("DD/MM/YYYY")
                  : data.Params.DateTo
              );
            }
            for (let i = 0; i < data.tpurchaseorderlist.length; i++) {
              let totalAmountEx =
                utilityService.modifynegativeCurrencyFormat(
                  data.tpurchaseorderlist[i].TotalAmount
                ) || 0.0;
              let totalTax =
                utilityService.modifynegativeCurrencyFormat(
                  data.tpurchaseorderlist[i].TotalTax
                ) || 0.0;
              let totalAmount =
                utilityService.modifynegativeCurrencyFormat(
                  data.tpurchaseorderlist[i].TotalAmountInc
                ) || 0.0;
              let totalPaid =
                utilityService.modifynegativeCurrencyFormat(
                  data.tpurchaseorderlist[i].Payment
                ) || 0.0;
              let totalOutstanding =
                utilityService.modifynegativeCurrencyFormat(
                  data.tpurchaseorderlist[i].Balance
                ) || 0.0;
              let orderstatus = data.tpurchaseorderlist[i].OrderStatus || "";
              if (data.tpurchaseorderlist[i].Deleted == true) {
                orderstatus = "Deleted";
              }else if(data.tpurchaseorderlist[i].SupplierName == ''){
                orderstatus = "Deleted";
              };
              var dataList = {
                id: data.tpurchaseorderlist[i].PurchaseOrderID || "",
                employee: data.tpurchaseorderlist[i].EmployeeName || "",
                sortdate:
                  data.tpurchaseorderlist[i].OrderDate != ""
                    ? moment(data.tpurchaseorderlist[i].OrderDate).format(
                        "YYYY/MM/DD"
                      )
                    : data.tpurchaseorderlist[i].OrderDate,
                orderdate:
                  data.tpurchaseorderlist[i].OrderDate != ""
                    ? moment(data.tpurchaseorderlist[i].OrderDate).format(
                        "DD/MM/YYYY"
                      )
                    : data.tpurchaseorderlist[i].OrderDate,
                suppliername: data.tpurchaseorderlist[i].SupplierName || "",
                totalamountex: totalAmountEx || 0.0,
                totaltax: totalTax || 0.0,
                totalamount: totalAmount || 0.0,
                totalpaid: totalPaid || 0.0,
                totaloustanding: totalOutstanding || 0.0,
                orderstatus: orderstatus || "",
                custfield1: "" || "",
                custfield2: "" || "",
                custfield3: "" || "",
                comments: data.tpurchaseorderlist[i].Comments || "",
              };
              //if(data.tpurchaseorderlist[i].Deleted === false && data.tpurchaseorderlist[i].SupplierName.replace(/\s/g, '') != ''){
              dataTableList.push(dataList);
              //}
              // dataTableList.push(dataList);
            }
            templateObject.datatablerecords.set(dataTableList);

            if (templateObject.datatablerecords.get()) {
              Meteor.call(
                "readPrefMethod",
                Session.get("mycloudLogonID"),
                "tblpurchaseorderlist",
                function (error, result) {
                  if (error) {
                  } else {
                    if (result) {
                      for (let i = 0; i < result.customFields.length; i++) {
                        let customcolumn = result.customFields;
                        let columData = customcolumn[i].label;
                        let columHeaderUpdate = customcolumn[i].thclass.replace(
                          / /g,
                          "."
                        );
                        let hiddenColumn = customcolumn[i].hidden;
                        let columnClass = columHeaderUpdate.split(".")[1];
                        let columnWidth = customcolumn[i].width;
                        let columnindex = customcolumn[i].index + 1;

                        if (hiddenColumn == true) {
                          $("." + columnClass + "").addClass("hiddenColumn");
                          $("." + columnClass + "").removeClass("showColumn");
                        } else if (hiddenColumn == false) {
                          $("." + columnClass + "").removeClass("hiddenColumn");
                          $("." + columnClass + "").addClass("showColumn");
                        }
                      }
                    }
                  }
                }
              );

              setTimeout(function () {
                MakeNegative();
              }, 100);
            }

            setTimeout(function () {
              //$.fn.dataTable.moment('DD/MM/YY');
              $("#tblpurchaseorderlist")
                .DataTable({
                  columnDefs: [{ type: "date", targets: 0 }],
                  sDom: "<'row'><'row'<'col-sm-12 col-md-6'f><'col-sm-12 col-md-6 colDateFilter'l>r>t<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>B",
                  buttons: [
                    {
                      extend: "excelHtml5",
                      text: "",
                      download: "open",
                      className: "btntabletocsv hiddenColumn",
                      filename: "Purchase Order List - " + moment().format(),
                      orientation: "portrait",
                      exportOptions: {
                        columns: ":visible",
                        format: {
                          body: function (data, row, column) {
                            if (data.includes("</span>")) {
                              var res = data.split("</span>");
                              data = res[1];
                            }

                            return column === 1
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
                      title: "Purchase Order List",
                      filename: "Purchase Order List - " + moment().format(),
                      exportOptions: {
                        columns: ":visible",
                        stripHtml: false,
                      },
                    },
                  ],
                  select: true,
                  destroy: true,
                  colReorder: true,
                  // bStateSave: true,
                  // rowId: 0,
                  pageLength: initialReportDatatableLoad,
                  bLengthChange: false,
                  info: true,
                  responsive: true,
                  order: [
                    [0, "desc"],
                    [2, "desc"],
                  ],
                  action: function () {
                    $("#tblpurchaseorderlist").DataTable().ajax.reload();
                  },
                  fnDrawCallback: function (oSettings) {
                    let checkurlIgnoreDate =
                      FlowRouter.current().queryParams.ignoredate;

                    $(".paginate_button.page-item").removeClass("disabled");
                    $("#tblpurchaseorderlist_ellipsis").addClass("disabled");

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

                    $(
                      ".paginate_button.next:not(.disabled)",
                      this.api().table().container()
                    ).on("click", function () {
                      $(".fullScreenSpin").css("display", "inline-block");
                      let dataLenght = oSettings._iDisplayLength;

                      var dateFrom = new Date(
                        $("#dateFrom").datepicker("getDate")
                      );
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

                      if(data.Params.IgnoreDates == true){
                        sideBarService
                          .getAllTPurchaseOrderListData(
                            formatDateFrom,
                            formatDateTo,
                            true,
                            initialDatatableLoad,
                            oSettings.fnRecordsDisplay()
                          )
                          .then(function (dataObjectnew) {
                            getVS1Data("TPurchaseOrderList")
                              .then(function (dataObjectold) {
                                if (dataObjectold.length == 0) {
                                } else {
                                  let dataOld = JSON.parse(
                                    dataObjectold[0].data
                                  );

                                  var thirdaryData = $.merge(
                                    $.merge(
                                      [],
                                      dataObjectnew.tpurchaseorderlist
                                    ),
                                    dataOld.tpurchaseorderlist
                                  );
                                  let objCombineData = {
                                    Params: dataOld.Params,
                                    tpurchaseorderlist: thirdaryData,
                                  };

                                  addVS1Data(
                                    "TPurchaseOrderList",
                                    JSON.stringify(objCombineData)
                                  )
                                    .then(function (datareturn) {
                                      templateObject.resetData(objCombineData);
                                      $(".fullScreenSpin").css(
                                        "display",
                                        "none"
                                      );
                                    })
                                    .catch(function (err) {
                                      $(".fullScreenSpin").css(
                                        "display",
                                        "none"
                                      );
                                    });
                                }
                              })
                              .catch(function (err) {});
                          })
                          .catch(function (err) {
                            $(".fullScreenSpin").css("display", "none");
                          });
                      } else {
                        sideBarService
                          .getAllTPurchaseOrderListData(
                            formatDateFrom,
                            formatDateTo,
                            false,
                            initialDatatableLoad,
                            oSettings.fnRecordsDisplay()
                          )
                          .then(function (dataObjectnew) {
                            getVS1Data("TPurchaseOrderList")
                              .then(function (dataObjectold) {
                                if (dataObjectold.length == 0) {
                                } else {
                                  let dataOld = JSON.parse(
                                    dataObjectold[0].data
                                  );

                                  var thirdaryData = $.merge(
                                    $.merge(
                                      [],
                                      dataObjectnew.tpurchaseorderlist
                                    ),
                                    dataOld.tpurchaseorderlist
                                  );
                                  let objCombineData = {
                                    Params: dataOld.Params,
                                    tpurchaseorderlist: thirdaryData,
                                  };

                                  addVS1Data(
                                    "TPurchaseOrderList",
                                    JSON.stringify(objCombineData)
                                  )
                                    .then(function (datareturn) {
                                      templateObject.resetData(objCombineData);
                                      $(".fullScreenSpin").css(
                                        "display",
                                        "none"
                                      );
                                    })
                                    .catch(function (err) {
                                      $(".fullScreenSpin").css(
                                        "display",
                                        "none"
                                      );
                                    });
                                }
                              })
                              .catch(function (err) {});
                          })
                          .catch(function (err) {
                            $(".fullScreenSpin").css("display", "none");
                          });
                      }
                    });

                    setTimeout(function () {
                      MakeNegative();
                    }, 100);
                  },
                  fnInitComplete: function () {
                    this.fnPageChange("last");
                    $(
                      "<button class='btn btn-primary btnRefreshPOList' type='button' id='btnRefreshPOList' style='padding: 4px 10px; font-size: 14px; margin-left: 8px !important;'><i class='fas fa-search-plus' style='margin-right: 5px'></i>Search</button>"
                    ).insertAfter("#tblpurchaseorderlist_filter");
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
                  let draftRecord = templateObject.datatablerecords.get();
                  templateObject.datatablerecords.set(draftRecord);
                })
                .on("column-reorder", function () {})
                .on("length.dt", function (e, settings, len) {
                  setTimeout(function () {
                    MakeNegative();
                  }, 100);
                });
              $(".fullScreenSpin").css("display", "none");
            }, 0);

            var columns = $("#tblpurchaseorderlist th");
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
            $("div.dataTables_filter input").addClass(
              "form-control form-control-sm"
            );
            $("#tblpurchaseorderlist tbody").on("click", "tr", function () {
              var listData = $(this).closest("tr").attr("id");
              var checkDeleted =
                $(this).closest("tr").find(".colStatus").text() || "";
              if (listData) {
                if (checkDeleted == "Deleted") {
                  swal(
                    "You Cannot View This Transaction",
                    "Because It Has Been Deleted",
                    "info"
                  );
                } else {
                  FlowRouter.go("/purchaseordercard?id=" + listData);
                }
              }
            });

            templateObject.getCustomFieldData();
          })
          .catch(function (err) {
            // Bert.alert('<strong>' + err + '</strong>!', 'danger');
            $(".fullScreenSpin").css("display", "none");
            // Meteor._reload.reload();
          });
      });
  };

  templateObject.getAllFilterPurchaseOrderData = function (fromDate,toDate,ignoreDate) {
    sideBarService.getAllTPurchaseOrderListData(fromDate,toDate,ignoreDate,initialReportLoad,0).then(function (data) {
        addVS1Data("TPurchaseOrderList", JSON.stringify(data)).then(function (datareturn) {
            location.reload();
          }).catch(function (err) {
            $('.fullScreenSpin').css('display', 'none');
          });
      }).catch(function (err) {
        $(".fullScreenSpin").css("display", "none");
      });
  };

  if(FlowRouter.current().queryParams.overview){
    templateObject.getAllFilterPurchaseOrderData("", "", true);
  }else{
    templateObject.getAllPurchaseOrderData();
  }


  // custom field displaysettings
  templateObject.getCustomFieldData= function() {
    let listType = "ltPurchaseOrderList";
      getVS1Data('TCustomFieldList').then(function (dataObject) {
          if(dataObject.length == 0){
                sideBarService.getAllCustomFieldsWithQuery(listType).then(function (data) {
                  templateObject.setCustomFieldDataCheckIndexDB(data);
                });
            }else{
              let data = JSON.parse(dataObject[0].data);
              templateObject.setCustomFieldDataCheckIndexDB(data);
            }
      }).catch(function (err) {
            sideBarService.getAllCustomFieldsWithQuery(listType).then(function (data) {
              templateObject.setCustomFieldDataCheckIndexDB(data);
            });
      });
  }

  // custom field displaysettings
  templateObject.setCustomFieldDataCheckIndexDB = function(data) {

    let custFields = [];
    let dispFields = [];
    let customData = {};
    let customFieldCount = 11;
    let listType = "ltPurchaseOrderList";

    let reset_data = [

      { label: 'Order Date', class: 'colOrderDate', active: true },
      { label: 'P/O No.', class: 'colPurchaseNo', active: true },
      { label: 'Supplier', class: 'colSupplier', active: true },
      { label: 'Amount(Ex)', class: 'colAmountEx', active: true },
      { label: 'Tax', class: 'colTax', active: true },
      { label: 'Amount', class: 'colAmount', active: true },
      { label: 'Paid', class: 'colPaid', active: true },
      { label: 'Outstanding', class: 'colBalanceOutstanding', active: false },
      { label: 'Status', class: 'colStatus', active: true },
      { label: 'Employee', class: 'colEmployee', active: true },
      { label: 'Comments', class: 'colComments', active: false },
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
});

Template.purchaseorderlist.events({
  "click #btnNewPurchaseOrder": function (event) {
    FlowRouter.go("/purchaseordercard");
  },
  "click #btnPurchaseOrderBOList": function (event) {
    FlowRouter.go("/purchaseorderlistBO");
  },
  "click .chkDatatable": function (event) {
    var columns = $("#tblpurchaseorderlist th");
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
  "keyup #tblpurchaseorderlist_filter input": function (event) {
    if ($(event.target).val() != "") {
      $(".btnRefreshPOList").addClass("btnSearchAlert");
    } else {
      $(".btnRefreshPOList").removeClass("btnSearchAlert");
    }
    if (event.keyCode == 13) {
      $(".btnRefreshPOList").trigger("click");
    }
  },
  "click .btnRefreshPOList": function (event) {
    let templateObject = Template.instance();
    let utilityService = new UtilityService();
    let tableProductList;
    const dataTableList = [];
    var splashArrayInvoiceList = new Array();
    const lineExtaSellItems = [];
    $(".fullScreenSpin").css("display", "inline-block");
    let dataSearchName = $("#tblpurchaseorderlist_filter input").val();
    if (dataSearchName.replace(/\s/g, "") != "") {
      sideBarService
        .getNewPoByNameOrID(dataSearchName)
        .then(function (data) {
          let lineItems = [];
          let lineItemObj = {};
          addVS1Data("TPurchaseOrderEx", JSON.stringify(data));
          for (let i = 0; i < data.tpurchaseorderex.length; i++) {
            let totalAmountEx =
              utilityService.modifynegativeCurrencyFormat(
                data.tpurchaseorderex[i].fields.TotalAmount
              ) || 0.0;
            let totalTax =
              utilityService.modifynegativeCurrencyFormat(
                data.tpurchaseorderex[i].fields.TotalTax
              ) || 0.0;
            let totalAmount =
              utilityService.modifynegativeCurrencyFormat(
                data.tpurchaseorderex[i].fields.TotalAmountInc
              ) || 0.0;
            let totalPaid =
              utilityService.modifynegativeCurrencyFormat(
                data.tpurchaseorderex[i].fields.TotalPaid
              ) || 0.0;
            let totalOutstanding =
              utilityService.modifynegativeCurrencyFormat(
                data.tpurchaseorderex[i].fields.TotalBalance
              ) || 0.0;
            var dataList = {
              id: data.tpurchaseorderex[i].fields.ID || "",
              employee: data.tpurchaseorderex[i].fields.EmployeeName || "",
              sortdate:
                data.tpurchaseorderex[i].fields.OrderDate != ""
                  ? moment(data.tpurchaseorderex[i].fields.OrderDate).format(
                      "YYYY/MM/DD"
                    )
                  : data.tpurchaseorderex[i].fields.OrderDate,
              orderdate:
                data.tpurchaseorderex[i].fields.OrderDate != ""
                  ? moment(data.tpurchaseorderex[i].fields.OrderDate).format(
                      "DD/MM/YYYY"
                    )
                  : data.tpurchaseorderex[i].fields.OrderDate,
              suppliername: data.tpurchaseorderex[i].fields.SupplierName || "",
              totalamountex: totalAmountEx || 0.0,
              totaltax: totalTax || 0.0,
              totalamount: totalAmount || 0.0,
              totalpaid: totalPaid || 0.0,
              totaloustanding: totalOutstanding || 0.0,
              orderstatus: data.tpurchaseorderex[i].fields.OrderStatus || "",
              custfield1: "" || "",
              custfield2: "" || "",
              custfield3: "" || "",
              comments: data.tpurchaseorderex[i].fields.Comments || "",
            };
            if (
              data.tpurchaseorderex[i].fields.Deleted === false &&
              data.tpurchaseorderex[i].fields.SupplierName.replace(/\s/g, "") !=
                ""
            ) {
              dataTableList.push(dataList);
            }
            // dataTableList.push(dataList);
          }
          templateObject.datatablerecords.set(dataTableList);
          let item = templateObject.datatablerecords.get();
          $(".fullScreenSpin").css("display", "none");
          if (dataTableList) {
            var datatable = $("#tblpurchaseorderlist").DataTable();
            $("#tblpurchaseorderlist > tbody").empty();
            for (let x = 0; x < item.length; x++) {
              $("#tblpurchaseorderlist > tbody").append(
                ' <tr class="dnd-moved" id="' +
                  item[x].id +
                  '" style="cursor: pointer;">' +
                  '<td contenteditable="false" class="colSortDate hiddenColumn">' +
                  item[x].sortdate +
                  "</td>" +
                  '<td contenteditable="false" class="colSaleDate" ><span style="display:none;">' +
                  item[x].sortdate +
                  "</span>" +
                  item[x].orderdate +
                  "</td>" +
                  '<td contenteditable="false" class="colSalesNo">' +
                  item[x].id +
                  "</td>" +
                  '<td contenteditable="false" class="colSupplier" >' +
                  item[x].suppliername +
                  "</td>" +
                  '<td contenteditable="false" class="colAmountEx" style="text-align: right!important;">' +
                  item[x].totalamountex +
                  "</td>" +
                  '<td contenteditable="false" class="colTax" style="text-align: right!important;">' +
                  item[x].totaltax +
                  "</td>" +
                  '<td contenteditable="false" class="colAmount" style="text-align: right!important;">' +
                  item[x].totalamount +
                  "</td>" +
                  '<td contenteditable="false" class="colPaid" style="text-align: right!important;">' +
                  item[x].totalpaid +
                  "</td>" +
                  '<td contenteditable="false" class="colBalanceOutstanding" style="text-align: right!important;">' +
                  item[x].totaloustanding +
                  "</td>" +
                  '<td contenteditable="false" class="colStatus hiddenColumn">' +
                  item[x].orderstatus +
                  "</td>" +
                  '<td contenteditable="false" class="colSaleCustField1 hiddenColumn">' +
                  item[x].custfield1 +
                  "</td>" +
                  '<td contenteditable="false" class="colSaleCustField2 hiddenColumn">' +
                  item[x].custfield2 +
                  "</td>" +
                  '<td contenteditable="false" class="colEmployee hiddenColumn">' +
                  item[x].employee +
                  "</td>" +
                  '<td contenteditable="false" class="colComments">' +
                  item[x].comments +
                  "</td>" +
                  "</tr>"
              );
            }
            $(".dataTables_info").html(
              "Showing 1 to " +
                data.tpurchaseorderex.length +
                " of " +
                data.tpurchaseorderex.length +
                " entries"
            );
          } else {
            $(".fullScreenSpin").css("display", "none");
            swal({
              title: "Question",
              text: "Purchase does not exist, would you like to create it?",
              type: "question",
              showCancelButton: true,
              confirmButtonText: "Yes",
              cancelButtonText: "No",
            }).then((result) => {
              if (result.value) {
                FlowRouter.go("/purchaseordercard");
              } else if (result.dismiss === "cancel") {
                //$('#productListModal').modal('toggle');
              }
            });
          }
        })
        .catch(function (err) {
          $(".fullScreenSpin").css("display", "none");
        });
    } else {
      $(".btnRefresh").trigger("click");
    }
  },
  "click .resetTable": function (event) {
    let templateObject = Template.instance();
    let custFields = templateObject.custfields.get();

    let reset_data = [
      { label: 'Order Date', class: 'colOrderDate', active: true },
      { label: 'P/O No.', class: 'colPurchaseNo', active: true },
      { label: 'Supplier', class: 'colSupplier', active: true },
      { label: 'Amount(Ex)', class: 'colAmountEx', active: true },
      { label: 'Tax', class: 'colTax', active: true },
      { label: 'Amount', class: 'colAmount', active: true },
      { label: 'Paid', class: 'colPaid', active: true },
      { label: 'Outstanding', class: 'colBalanceOutstanding', active: false },
      { label: 'Status', class: 'colStatus', active: true },
      { label: 'Employee', class: 'colEmployee', active: true },
      { label: 'Comments', class: 'colComments', active: false },
      { label: custFields[0].custfieldlabel, class: 'colSaleCustField1', active: custFields[0].active },
      { label: custFields[1].custfieldlabel, class: 'colSaleCustField2', active: custFields[1].active },
      { label: custFields[2].custfieldlabel, class: 'colSaleCustField3', active: custFields[2].active }
    ];

    $('.displaySettings').each(function(index) {
      var $tblrow = $(this);
      $tblrow.find(".divcolumn").text(reset_data[index].label);
      $tblrow.find(".custom-control-input").prop('checked', reset_data[index].active);

      // var title = datable.column( index+1 ).header();
      var title = $('#tblpurchaseorderlist').find('th').eq(index + 1);
      $(title).html(reset_data[index].label);

      if (reset_data[index].active) {
        $('.' + reset_data[index].class).css('display', 'table-cell');
        $('.' + reset_data[index].class).css('padding', '.75rem');
        $('.' + reset_data[index].class).css('vertical-align', 'top');
      } else {
        $('.' + reset_data[index].class).css('display', 'none');
      }

    });
  },
  "click .saveTable": function (event) {
    let lineItems = [];
    let organisationService = new OrganisationService();
    let listType = "ltPurchaseOrderList";

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
        //Reload Custom Field on Save
        sideBarService.getAllCustomFields().then(function(data) {
            addVS1Data('TCustomFieldList', JSON.stringify(data));
        });
        $('#myModal2').modal('hide');
      }).catch(function (err) {
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
  },

  "blur .divcolumn": function (event) {
    let columData = $(event.target).text();
    let columnDatanIndex = $(event.target)
      .closest("div.columnSettings")
      .attr("id");
    var datable = $("#tblpurchaseorderlist").DataTable();
    var title = datable.column(columnDatanIndex).header();
    $(title).html(columData);
  },
  "change .rngRange": function (event) {
    let range = $(event.target).val();
    let columnDataValue = $(event.target)
      .closest("div")
      .prev()
      .find(".divcolumn")
      .text();
    var datable = $("#tblpurchaseorderlist th");
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
    var columns = $("#tblpurchaseorderlist th");
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
    jQuery("#tblpurchaseorderlist_wrapper .dt-buttons .btntabletocsv").click();
    $(".fullScreenSpin").css("display", "none");
  },
  "click .printConfirm": function (event) {

    let values = [];
    let basedOnTypeStorages = Object.keys(localStorage);
    basedOnTypeStorages = basedOnTypeStorages.filter((storage) => {
        let employeeId = storage.split('_')[2];
        return storage.includes('BasedOnType_') && employeeId == Session.get('mySessionEmployeeLoggedID')
    });
    let i = basedOnTypeStorages.length;
    if (i > 0) {
        while (i--) {
            values.push(localStorage.getItem(basedOnTypeStorages[i]));
        }
    }
    values.forEach(value => {
        let reportData = JSON.parse(value);
        reportData.HostURL = $(location).attr('protocal') ? $(location).attr('protocal') + "://" + $(location).attr('hostname') : 'http://' + $(location).attr('hostname');
        if (reportData.BasedOnType.includes("P")) {
            if (reportData.FormID == 1) {
                let formIds = reportData.FormIDs.split(',');
                if (formIds.includes("69")) {
                    reportData.FormID = 69;
                    Meteor.call('sendNormalEmail', reportData);
                }
            } else {
                if (reportData.FormID == 69)
                    Meteor.call('sendNormalEmail', reportData);
            }
        }
    });
    $(".fullScreenSpin").css("display", "inline-block");
    jQuery("#tblpurchaseorderlist_wrapper .dt-buttons .btntabletopdf").click();
    $(".fullScreenSpin").css("display", "none");
  },
  "click .btnRefresh":async function () {
    $(".fullScreenSpin").css("display", "inline-block");
    let currentDate = new Date();
    let hours = currentDate.getHours(); //returns 0-23
    let minutes = currentDate.getMinutes(); //returns 0-59
    let seconds = currentDate.getSeconds(); //returns 0-59
    let month = currentDate.getMonth() + 1;
    let days = currentDate.getDate();

    if (currentDate.getMonth() + 1 < 10) {
      month = "0" + (currentDate.getMonth() + 1);
    }

    if (currentDate.getDate() < 10) {
      days = "0" + currentDate.getDate();
    }
    let currenctTodayDate =currentDate.getFullYear() +"-" +month +"-" +days +" " +hours +":" +minutes +":" +seconds;
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
    var toDate =
      currentBeginDate.getFullYear() + "-" + fromDateMonth + "-" + fromDateDay;
    let prevMonth11Date = moment().subtract(reportsloadMonths, "months").format("YYYY-MM-DD");

    sideBarService.getAllPurchaseOrderListAll(prevMonth11Date,toDate,true,initialReportLoad,0).then(function (data) {
        addVS1Data("TbillReport", JSON.stringify(data)).then(function (datareturn) {}).catch(function (err) {});
      }).catch(function (err) {});

      sideBarService.getAllPurchaseOrderList(initialDataLoad, 0).then(function (data) {
          addVS1Data("TPurchaseOrderEx", JSON.stringify(data)).then(function (datareturn) {
              window.open("/purchaseorderlist", "_self");
            }).catch(function (err) {
              window.open("/purchaseorderlist", "_self");
            });
        }).catch(function (err) {
          window.open("/purchaseorderlist", "_self");
        });

    sideBarService.getAllTPurchaseOrderListData(prevMonth11Date,toDate,true,initialReportLoad,0).then(async function (dataPO) {
        addVS1Data("TPurchaseOrderList", JSON.stringify(dataPO)).then(async function (datareturn) {
          sideBarService.getTPaymentList(prevMonth11Date, toDate, true, initialReportLoad, 0,'').then(function(dataPaymentList) {
          addVS1Data('TPaymentList', JSON.stringify(dataPaymentList)).then(async function(datareturn) {
              sideBarService.getAllTSupplierPaymentListData(prevMonth11Date, toDate, true, initialReportLoad, 0).then(async function(dataSuppPay) {
                  addVS1Data('TSupplierPaymentList', JSON.stringify(dataSuppPay)).then(async function(datareturn) {
                      sideBarService.getAllTCustomerPaymentListData(prevMonth11Date, toDate, true, initialReportLoad, 0).then(async function(dataCustPay) {
                          await addVS1Data('TCustomerPaymentList', JSON.stringify(dataCustPay)).then(function(datareturn) {
                            setTimeout(function () {
                              window.open('/purchaseorderlist', '_self');
                            }, 2000);
                          }).catch(function(err) {
                            setTimeout(function () {
                              window.open('/purchaseorderlist', '_self');
                            }, 2000);
                          });
                      }).catch(function(err) {
                        setTimeout(function () {
                          window.open('/purchaseorderlist', '_self');
                        }, 2000);
                      });
                  }).catch(function(err) {
                      setTimeout(function () {
                          window.open('/purchaseorderlist', '_self');
                       }, 2000);
                  });
              }).catch(function(err) {
                setTimeout(function () {
                  window.open('/purchaseorderlist', '_self');
                }, 2000);
              });
          }).catch(function(err) {
            setTimeout(function () {
              window.open('/purchaseorderlist', '_self');
            }, 2000);
          });
      }).catch(function(err) {
        setTimeout(function () {
          window.open('/purchaseorderlist', '_self');
        }, 2000);

      });
          }).catch(function (err) {
            sideBarService.getAllPurchaseOrderList(initialDataLoad, 0).then(function (data) {
                addVS1Data("TPurchaseOrderEx", JSON.stringify(data)).then(function (datareturn) {
                    window.open("/purchaseorderlist", "_self");
                  }).catch(function (err) {
                    window.open("/purchaseorderlist", "_self");
                  });
              }).catch(function (err) {
                window.open("/purchaseorderlist", "_self");
              });
          });
      }).catch(function (err) {
        sideBarService.getAllPurchaseOrderList(initialDataLoad, 0).then(function (data) {
            addVS1Data("TPurchaseOrderEx", JSON.stringify(data)).then(function (datareturn) {
                window.open("/purchaseorderlist", "_self");
              }).catch(function (err) {
                window.open("/purchaseorderlist", "_self");
              });
          }).catch(function (err) {
            window.open("/purchaseorderlist", "_self");
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
      templateObject.getAllFilterPurchaseOrderData(
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
      templateObject.getAllFilterPurchaseOrderData(
        formatDateFrom,
        formatDateTo,
        false
      );
    }
    },500);
  },
  "click #today": function () {
      let templateObject = Template.instance();
      $('.fullScreenSpin').css('display', 'inline-block');
      $('#dateFrom').attr('readonly', false);
      $('#dateTo').attr('readonly', false);
      var currentBeginDate = new Date();
      var begunDate = moment(currentBeginDate).format("DD/MM/YYYY");
      let fromDateMonth = (currentBeginDate.getMonth() + 1);
      let fromDateDay = currentBeginDate.getDate();
      if((currentBeginDate.getMonth()+1) < 10){
          fromDateMonth = "0" + (currentBeginDate.getMonth()+1);
      }else{
        fromDateMonth = (currentBeginDate.getMonth()+1);
      }

      if(currentBeginDate.getDate() < 10){
          fromDateDay = "0" + currentBeginDate.getDate();
      }
      var toDateERPFrom = currentBeginDate.getFullYear()+ "-" +(fromDateMonth) + "-"+(fromDateDay);
      var toDateERPTo = currentBeginDate.getFullYear()+ "-" +(fromDateMonth) + "-"+(fromDateDay);

      var toDateDisplayFrom = (fromDateDay)+ "/" +(fromDateMonth) + "/"+currentBeginDate.getFullYear();
      var toDateDisplayTo = (fromDateDay)+ "/" +(fromDateMonth) + "/"+currentBeginDate.getFullYear();

      $("#dateFrom").val(toDateDisplayFrom);
      $("#dateTo").val(toDateDisplayTo);
      templateObject.getAllFilterPurchaseOrderData(toDateERPFrom,toDateERPTo, false);
  },
  "click #lastweek": function () {
      let templateObject = Template.instance();
      $('.fullScreenSpin').css('display', 'inline-block');
      $('#dateFrom').attr('readonly', false);
      $('#dateTo').attr('readonly', false);
      var currentBeginDate = new Date();
      var begunDate = moment(currentBeginDate).format("DD/MM/YYYY");
      let fromDateMonth = (currentBeginDate.getMonth() + 1);
      let fromDateDay = currentBeginDate.getDate();
      if((currentBeginDate.getMonth()+1) < 10){
          fromDateMonth = "0" + (currentBeginDate.getMonth()+1);
      }else{
        fromDateMonth = (currentBeginDate.getMonth()+1);
      }

      if(currentBeginDate.getDate() < 10){
          fromDateDay = "0" + currentBeginDate.getDate();
      }
      var toDateERPFrom = currentBeginDate.getFullYear()+ "-" +(fromDateMonth) + "-"+(fromDateDay - 7);
      var toDateERPTo = currentBeginDate.getFullYear()+ "-" +(fromDateMonth) + "-"+(fromDateDay);

      var toDateDisplayFrom = (fromDateDay -7)+ "/" +(fromDateMonth) + "/"+currentBeginDate.getFullYear();
      var toDateDisplayTo = (fromDateDay)+ "/" +(fromDateMonth) + "/"+currentBeginDate.getFullYear();

      $("#dateFrom").val(toDateDisplayFrom);
      $("#dateTo").val(toDateDisplayTo);
      templateObject.getAllFilterPurchaseOrderData(toDateERPFrom,toDateERPTo, false);
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
    templateObject.getAllFilterPurchaseOrderData(
      getDateFrom,
      getLoadDate,
      false
    );
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
    templateObject.getAllFilterPurchaseOrderData(
      getDateFrom,
      getLoadDate,
      false
    );
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
    templateObject.getAllFilterPurchaseOrderData(
      getDateFrom,
      getLoadDate,
      false
    );
  },
  "click #ignoreDate": function () {
    let templateObject = Template.instance();
    $(".fullScreenSpin").css("display", "inline-block");
    $("#dateFrom").attr("readonly", true);
    $("#dateTo").attr("readonly", true);
    templateObject.getAllFilterPurchaseOrderData("", "", true);
  },
});

Template.purchaseorderlist.helpers({
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
      PrefName: "tblpurchaseorderlist",
    });
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
