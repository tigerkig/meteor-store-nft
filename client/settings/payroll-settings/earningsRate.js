import {ReactiveVar} from 'meteor/reactive-var';
import {SideBarService} from '../../js/sidebar-service';
import { UtilityService } from "../../utility-service";
import Earning from '../../js/Api/Model/Earning'
import EarningFields from '../../js/Api/Model/EarningFields'
import EmployeePayrollApi from '../../js/Api/EmployeePayrollApi'
import ApiService from "../../js/Api/Module/ApiService";
import { EmployeePayrollService } from '../../js/employeepayroll-service';
import '../../lib/global/indexdbstorage.js';
import 'jquery-editable-select';

let sideBarService = new SideBarService();
let utilityService = new UtilityService();
let employeePayrollService = new EmployeePayrollService();

Template.earningRateSettings.onCreated(function() {
  const templateObject = Template.instance();
  templateObject.datatablerecords = new ReactiveVar([]);
  templateObject.datatableallowancerecords = new ReactiveVar([]);
  templateObject.tableheaderrecords = new ReactiveVar([]);
  templateObject.countryData = new ReactiveVar();
  templateObject.Ratetypes = new ReactiveVar([]);
  templateObject.imageFileData=new ReactiveVar();
  templateObject.currentDrpDownID = new ReactiveVar();
  // templateObject.Accounts = new ReactiveVar([]);
});

Template.earningRateSettings.onRendered(function() {

  const templateObject = Template.instance();
  const dataTableList = [];
  var splashArrayEarningList = new Array();

  function MakeNegative() {
    $('td').each(function() {
        if ($(this).text().indexOf('-' + Currency) >= 0) $(this).addClass('text-danger')
    });
    $(function() {
        $('.modal-dialog').draggable({
            "handle":".modal-header, .modal-footer"
        });
    });
};

templateObject.saveDataLocalDB = async () => {

    const employeePayrolApis = new EmployeePayrollApi();
    // now we have to make the post request to save the data in database
    const employeePayrolEndpoint = employeePayrolApis.collection.findByName(
        employeePayrolApis.collectionNames.TEarnings
    );

    employeePayrolEndpoint.url.searchParams.append(
        "ListType",
        "'Detail'"
    );                
    
    const employeePayrolEndpointResponse = await employeePayrolEndpoint.fetch(); // here i should get from database all charts to be displayed

    if (employeePayrolEndpointResponse.ok == true) {
        employeePayrolEndpointJsonResponse = await employeePayrolEndpointResponse.json();
        if( employeePayrolEndpointJsonResponse.tearnings.length ){
            await addVS1Data('TEarnings', JSON.stringify(employeePayrolEndpointJsonResponse))
        }
        return employeePayrolEndpointJsonResponse
    }  
    return '';      
}


templateObject.getEarnings = async function(){
    try {
        let data = {};
        let splashArrayEarningList = new Array();
        let dataObject = await getVS1Data('TEarnings')   
        if ( dataObject.length == 0) {
            data = await templateObject.saveDataLocalDB();
        }else{
            data = JSON.parse(dataObject[0].data);
        }
        if( data.tearnings.length > 0 ){
            for (let i = 0; i < data.tearnings.length; i++) {            
                let dataList = [
                    data.tearnings[i].fields.ID || '',
                    data.tearnings[i].fields.EarningsName || '',
                    data.tearnings[i].fields.EarningType || '',
                    data.tearnings[i].fields.EarningsDisplayName || '',
                    data.tearnings[i].fields.EarningsRateType||'',
                    data.tearnings[i].fields.ExpenseAccount || '',
                    data.tearnings[i].fields.EarningsExemptPaygWithholding || '',
                    data.tearnings[i].fields.EarningsExemptSuperannuationGuaranteeCont || '',
                    data.tearnings[i].fields.EarningsReportableW1onActivityStatement || ''
                ];    
                splashArrayEarningList.push(dataList);
            }
        }
        templateObject.datatablerecords.set(splashArrayEarningList);
        $('.fullScreenSpin').css('display', 'none');
        setTimeout(function () {
            $('#tblEarnings').DataTable({  
                data: splashArrayEarningList,
                "sDom": "<'row'><'row'<'col-sm-12 col-md-6'f><'col-sm-12 col-md-6'l>r>t<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>B",
                columnDefs: [                              
                    
                    {
                        className: "colEarningsID hiddenColumn",
                        "targets": [0]
                    },
                    {
                        className: "colEarningsNames",
                        "targets": [1]
                    },  
                    {
                        className: "colEarningsType",
                        "targets": [2]
                    },      
                    {
                    className: "colEarningsDisplayName",
                    "targets": [3]
                    }, 
                    {
                    className: "colEarningsAccounts",
                    "targets": [4]
                    },   
                    {
                    className: "colEarningsRateType",
                    "targets": [5]
                    },
                    {
                    className: "colEarningsPAYG hiddenColumn"  ,
                    "targets": [6]
                    },  
                    {
                    className: "colEarningsSuperannuation hiddenColumn",
                    "targets": [7]
                    },  
                    {
                    className: "colEarningsReportableasW1 hiddenColumn",
                    "targets": [8]
                    }
                ],
                select: true,
                destroy: true,
                colReorder: true,
                pageLength: initialDatatableLoad,
                lengthMenu: [ [initialDatatableLoad, -1], [initialDatatableLoad, "All"] ],
                info: true,
                responsive: true,
                "order": [[0, "asc"]],
                action: function () {
                    $('#tblEarnings').DataTable().ajax.reload();
                },
                "fnDrawCallback": function (oSettings) {
                    $('.paginate_button.page-item').removeClass('disabled');
                    $('#tblEarnings_ellipsis').addClass('disabled');
                    if (oSettings._iDisplayLength == -1) {
                        if (oSettings.fnRecordsDisplay() > 150) {

                        }
                    } else {

                    }
                    if (oSettings.fnRecordsDisplay() < initialDatatableLoad) {
                        $('.paginate_button.page-item.next').addClass('disabled');
                    }

                    $('.paginate_button.next:not(.disabled)', this.api().table().container())
                        .on('click', function () {
                            $('.fullScreenSpin').css('display', 'inline-block');
                            var splashArrayEarningListDupp = new Array();
                            let dataLenght = oSettings._iDisplayLength;
                            let customerSearch = $('#tblEarnings_filter input').val();

                            sideBarService.getEarnings(initialDatatableLoad, oSettings.fnRecordsDisplay()).then(function (data) {

                                for (let i = 0; i < data.tearnings.length; i++) {              
                                    var dataList = [
                                    data.tearnings[i].fields.ID || '',
                                    data.tearnings[i].fields.EarningsName || '',
                                    data.tearnings[i].fields.EarningType || '',
                                    data.tearnings[i].fields.EarningsDisplayName || '',
                                    data.tearnings[i].fields.EarningsRateType||'',
                                    data.tearnings[i].fields.ExpenseAccount || '',
                                    data.tearnings[i].fields.EarningsExemptPaygWithholding || '',
                                    data.tearnings[i].fields.EarningsExemptSuperannuationGuaranteeCont || '',
                                    data.tearnings[i].fields.EarningsReportableW1onActivityStatement || ''
                                    ];
                                    splashArrayEarningList.push(dataList);
                                }
                                let uniqueChars = [...new Set(splashArrayEarningList)];
                                var datatable = $('#tblEarnings').DataTable();
                                datatable.clear();
                                datatable.rows.add(uniqueChars);
                                datatable.draw(false);
                                setTimeout(function () {
                                    $("#tblEarnings").dataTable().fnPageChange('last');
                                }, 400);

                                $('.fullScreenSpin').css('display', 'none');


                            }).catch(function (err) {
                                $('.fullScreenSpin').css('display', 'none');
                            });

                        });
                    setTimeout(function () {
                        MakeNegative();
                    }, 100);
                },
                "fnInitComplete": function () {
                    $("<button class='btn btn-primary btnAddordinaryTimeEarnings' data-dismiss='modal' data-toggle='modal' data-target='#ordinaryTimeEarningsModal' type='button' style='padding: 4px 10px; font-size: 14px; margin-left: 8px !important;'><i class='fas fa-plus'></i></button>").insertAfter("#tblEarnings_filter");
                    $("<button class='btn btn-primary btnRefreshEarnings' type='button' id='btnRefreshEarnings' style='padding: 4px 10px; font-size: 14px; margin-left: 8px !important;'><i class='fas fa-search-plus' style='margin-right: 5px'></i>Search</button>").insertAfter("#tblEarnings_filter");
                }

            }).on('page', function () {
                setTimeout(function () {
                    MakeNegative();
                }, 100);

            }).on('column-reorder', function () {

            }).on('length.dt', function (e, settings, len) {
                //$('.fullScreenSpin').css('display', 'inline-block');
                let dataLenght = settings._iDisplayLength;
                splashArrayEarningList = [];
                if (dataLenght == -1) {
                $('.fullScreenSpin').css('display', 'none');

                } else {
                    if (settings.fnRecordsDisplay() >= settings._iDisplayLength) {
                        $('.fullScreenSpin').css('display', 'none');
                    } else {
                        sideBarService.getEarnings(dataLenght, 0).then(function (dataNonBo) {

                            addVS1Data('TEarnings', JSON.stringify(dataNonBo)).then(function (datareturn) {
                                templateObject.resetData(dataNonBo);
                                $('.fullScreenSpin').css('display', 'none');
                            }).catch(function (err) {
                                $('.fullScreenSpin').css('display', 'none');
                            });
                        }).catch(function (err) {
                            $('.fullScreenSpin').css('display', 'none');
                        });
                    }
                }
                setTimeout(function () {
                    MakeNegative();
                }, 100);
            });
        }, 0);
    } catch (error) {
        $('.fullScreenSpin').css('display', 'none');
    }
};


templateObject.getEarnings();
    $('.edtExpenseAccountDropDown').editableSelect();
    $('.edtExpenseAccountDropDown').editableSelect().on('click.editable-select', async function (e, li) {
        let $search = $(this);
        let dropDownID = $search.attr('id')
        $('#selectLineID').val(dropDownID);
        let offset = $search.offset();
        let searchName = e.target.value || '';
        if (e.pageX > offset.left + $search.width() - 8) { // X button 16px wide?
            $('#accountListModal').modal('show');
        } else {
            if (searchName.replace(/\s/g, '') == '') {             
                $('#accountListModal').modal('show');
                return false
            }
            let dataObject =  await getVS1Data('TAccountVS1');
            if( dataObject.length > 0 ){
                data = JSON.parse(dataObject[0].data);
                let tAccounts = data.taccountvs1.filter((item) => {
                    if( item.fields.AccountName == searchName ){
                        return item;
                    }
                });   

                var accountid = tAccounts[0].fields.ID || '';
                var accounttype = tAccounts[0].fields.AccountTypeName;
                var accountname = tAccounts[0].fields.AccountName || '';
                var accountno = tAccounts[0].fields.AccountNumber || '';
                var taxcode = tAccounts[0].fields.TaxCode || '';
                var accountdesc = tAccounts[0].fields.Description || '';
                var bankaccountname = tAccounts[0].fields.BankAccountName || '';
                var bankbsb = tAccounts[0].fields.BSB || '';
                var bankacountno = tAccounts[0].fields.BankAccountNumber || '';

                var swiftCode = tAccounts[0].fields.Extra || '';
                var routingNo = tAccounts[0].fields.BankCode || '';

                var showTrans = tAccounts[0].fields.IsHeader || false;

                var cardnumber = tAccounts[0].fields.CarNumber || '';
                var cardcvc = tAccounts[0].fields.CVC || '';
                var cardexpiry = tAccounts[0].fields.ExpiryDate || '';

                if ((accounttype === "BANK")) {
                    $('.isBankAccount').removeClass('isNotBankAccount');
                    $('.isCreditAccount').addClass('isNotCreditAccount');
                }else if ((accounttype === "CCARD")) {
                    $('.isCreditAccount').removeClass('isNotCreditAccount');
                    $('.isBankAccount').addClass('isNotBankAccount');
                } else {
                    $('.isBankAccount').addClass('isNotBankAccount');
                    $('.isCreditAccount').addClass('isNotCreditAccount');
                }

                $('#edtAccountID').val(accountid);
                $('#sltAccountType').val(accounttype);
                $('#sltAccountType').append('<option value="'+accounttype+'" selected="selected">'+accounttype+'</option>');
                $('#edtAccountName').val(accountname);
                $('#edtAccountNo').val(accountno);
                $('#sltTaxCode').val(taxcode);
                $('#txaAccountDescription').val(accountdesc);
                $('#edtBankAccountName').val(bankaccountname);
                $('#edtBSB').val(bankbsb);
                $('#edtBankAccountNo').val(bankacountno);
                $('#swiftCode').val(swiftCode);
                $('#routingNo').val(routingNo);
                $('#edtBankName').val(localStorage.getItem('vs1companyBankName') || '');

                $('#edtCardNumber').val(cardnumber);
                $('#edtExpiryDate').val(cardexpiry ? moment(cardexpiry).format('DD/MM/YYYY') : "");
                $('#edtCvc').val(cardcvc);

                if(showTrans == 'true'){
                    $('.showOnTransactions').prop('checked', true);
                }else{
                    $('.showOnTransactions').prop('checked', false);
                }

                $('#addAccountModal').modal('show');  
            }      
        }
    });
    // Standard drop down
    $('.earningLineDropDown').editableSelect();
    $('.earningLineDropDown').editableSelect().on('click.editable-select', async function (e, li) {
        let $search = $(this);
        let offset = $search.offset();
        let dropDownID = $search.attr('id')
        templateObject.currentDrpDownID.set(dropDownID);
        let searchName = e.target.value || '';
        if (e.pageX > offset.left + $search.width() - 8) { // X button 16px wide?
            $('#earningRateForm')[0].reset();
            $('#earningRateSettingsModal').modal('show');
        } else {
            if (searchName.replace(/\s/g, '') == '') {             
                $('#earningRateSettingsModal').modal('show');
                return false
            }
            let data = {};
            let dataObject = await getVS1Data('TEarnings');   
            if ( dataObject.length == 0) {
                data = await templateObject.saveDataLocalDB();
            }else{
                data = JSON.parse(dataObject[0].data);
            }
            if( data.tearnings.length > 0 ){
                let tEarnings = data.tearnings.filter((item) => {
                    if( item.fields.EarningsName == searchName ){
                        return item;
                    }
                });
                $('#earningRateForm')[0].reset();
                $('#addEarningsLineModal').modal('hide');                
                if( tEarnings.length > 0 ){
                    let earningRate = tEarnings[0];
                    $('#earningID').val(earningRate.fields.ID)
                    $('#edtEarningsName').val(earningRate.fields.EarningsName)
                    $('#edtEarningsType').val(earningRate.fields.EarningType)
                    $('#edtDisplayName').val(earningRate.fields.EarningsDisplayName)
                    $('#edtRateType').val(earningRate.fields.EarningsRateType)
                    $('#edtExpenseAccount').val(earningRate.fields.ExpenseAccount)
                    $('#formCheck-ExemptPAYG').prop('checked', earningRate.fields.EarningsExemptPaygWithholding)
                    $('#formCheck-ExemptSuperannuation').prop('checked', earningRate.fields.EarningsExemptSuperannuationGuaranteeCont)
                    $('#formCheck-ExemptReportable').prop('checked', earningRate.fields.EarningsReportableW1onActivityStatement)
                }
                $('#earningRateSettingsModal').modal('hide');
                $('#ordinaryTimeEarningsModal').modal('show');
            }
        }
    });

    $(document).on("click", "#tblEarnings tbody tr", function (e) {
        var table = $(this);
        let earningRateID = templateObject.currentDrpDownID.get();
        let earningRate = table.find(".colEarningsNames").text()||'';
        $('#' + earningRateID).val(earningRate);
        $('#earningRateSettingsModal').modal('toggle');
    });

    $(document).on("click", "#tblAccount tbody tr", function (e) {
        var table = $(this);
        let name = table.find(".productName").text() ||'';
        let accountID = table.find(".colAccountID").text() ||'';
        let description = table.find(".productDesc").text() ||'';
        // let searchFilterID = templateObject.currentDrpDownID.get()
        let searchFilterID = $('#selectLineID').val();
        $('#' + searchFilterID).val(name);
        $("#edtDeductionAccountID").val(accountID);
        $("#edtDeductionDesctiption").val(description);
        $('#accountListModal').modal('toggle');
    });

});


Template.earningRateSettings.events({
    'keyup #tblEarnings_filter input': function (event) {
        if($(event.target).val() != ''){
          $(".btnRefreshEarnings").addClass('btnSearchAlert');
        }else{
          $(".btnRefreshEarnings").removeClass('btnSearchAlert');
        }
        if (event.keyCode == 13) {
           $(".btnRefreshEarnings").trigger("click");
        }
    },
    'click .btnAddordinaryTimeEarnings':function(event){
        $('#earningRateForm')[0].reset();
        $('#addEarningsLineModal').modal('hide');
    },
    'click .btnRefreshEarnings':function(event){      
        let templateObject = Template.instance();
        var splashArrayEarningList = new Array();
        const lineExtaSellItems = [];
        $('.fullScreenSpin').css('display', 'inline-block');
        let dataSearchName = $('#tblEarnings_filter input').val();
        if (dataSearchName.replace(/\s/g, '') != '') {
            employeePayrollService.getEarningByName(dataSearchName).then(function (data) {
                $(".btnRefreshEarnings").removeClass('btnSearchAlert');
                let lineItems = [];
                if (data.tearnings.length > 0) {
                    for (let i = 0; i < data.tearnings.length; i++) {              
                        let dataList = [
                          data.tearnings[i].fields.ID || '',
                          data.tearnings[i].fields.EarningsName || '',
                          data.tearnings[i].fields.EarningType || '',
                          data.tearnings[i].fields.EarningsDisplayName || '',
                          data.tearnings[i].fields.EarningsRateType||'',
                          data.tearnings[i].fields.ExpenseAccount || '',
                          data.tearnings[i].fields.EarningsExemptPaygWithholding || '',
                          data.tearnings[i].fields.EarningsExemptSuperannuationGuaranteeCont || '',
                          data.tearnings[i].fields.EarningsReportableW1onActivityStatement || ''
                        ];
                        splashArrayEarningList.push(dataList);
                    }
                    let uniqueChars = [...new Set(splashArrayEarningList)];
                    var datatable = $('#tblEarnings').DataTable();
                    datatable.clear();
                    datatable.rows.add(uniqueChars);
                    datatable.draw(false);
                    setTimeout(function () {
                        $("#tblEarnings").dataTable().fnPageChange('last');
                    }, 400);

                    $('.fullScreenSpin').css('display', 'none');
    
                } else {
                    $('.fullScreenSpin').css('display', 'none');
    
                    swal({
                        title: 'Question',
                        text: "Earning Rate does not exist, would you like to create it?",
                        type: 'question',
                        showCancelButton: true,
                        confirmButtonText: 'Yes',
                        cancelButtonText: 'No'
                    }).then((result) => {
                        if (result.value) {
                            $('#earningRateForm')[0].reset();
                            $('#edtEarningsName').val(dataSearchName)
                            $('#earningRateSettingsModal').modal('hide');
                            $('#addEarningsLineModal').modal('hide');
                            $('#ordinaryTimeEarningsModal').modal('show');
                        }
                    });
                }
            }).catch(function (err) {
                $('.fullScreenSpin').css('display', 'none');
            });
        } else {
    
          $(".btnRefresh").trigger("click");
        }

    },
    'click .saveEarningRates': async function (event) {
        let templateObject = Template.instance();
        $('.fullScreenSpin').css('display', 'inline-block');
        
        const employeePayrolApis = new EmployeePayrollApi();
        // now we have to make the post request to save the data in database
        const apiEndpoint = employeePayrolApis.collection.findByName(
            employeePayrolApis.collectionNames.TEarnings
        );

        let EarningsName = $('#edtEarningsName').val();
        let ID = $('#earningID').val();
        let EarningsType = $('#edtEarningsType').val();
        let EarningsDisplayName = $('#edtDisplayName').val();
        let EarningsRateType = $('#edtRateType').val();
        let ExpenseAccount = $('#edtExpenseAccount').val();
        let ExemptPAYG = ( $('#formCheck-ExemptPAYG').is(':checked') )? true: false;
        let ExemptSuperannuation = ( $('#formCheck-ExemptSuperannuation').is(':checked') )? true: false;
        let ExemptReportable = ( $('#formCheck-ExemptReportable').is(':checked') )? true: false;

        if(EarningsName == ''){
            swal({
                title: "Warning",
                text: "Please select Earning Name",
                type: 'warning',
            })
            return false;
        }

        if(EarningsRateType == ''){
            swal({
                title: "Warning",
                text: "Please enter Earning Rate Type",
                type: 'warning',
            })
            return false;
        }

        if(ExpenseAccount == ''){
            swal({
                title: "Warning",
                text: "Please enter Expense Account",
                type: 'warning',
            })
            return false;
        }
        

        /**
         * Saving Earning Object in localDB
        */
        let earningRateSetting = new Earning({
            type: 'TEarnings',
            fields: new EarningFields({
                ID: ID,
                EarningsName: EarningsName,
                EarningType: EarningsType,
                EarningsDisplayName: EarningsDisplayName,
                EarningsRateType: EarningsRateType,
                ExpenseAccount: ExpenseAccount,
                EarningsExemptPaygWithholding: ExemptPAYG,
                EarningsExemptSuperannuationGuaranteeCont: ExemptSuperannuation,
                EarningsReportableW1onActivityStatement: ExemptReportable,
                Active: true
            })
        });
        const ApiResponse = await apiEndpoint.fetch(null, {
            method: "POST",
            headers: ApiService.getPostHeaders(),
            body: JSON.stringify(earningRateSetting),
        });
    
        if (ApiResponse.ok == true) {
            const jsonResponse = await ApiResponse.json();
            $('#earningRateForm')[0].reset();
            await templateObject.saveDataLocalDB();
            await templateObject.getEarnings();
            $('#ordinaryTimeEarningsModal').modal('hide');
            $('.fullScreenSpin').css('display', 'none');
        }else{
            $('.fullScreenSpin').css('display', 'none');
        }
        
        
    },
});

Template.earningRateSettings.helpers({
    datatablerecords: () => {
        return Template.instance().datatablerecords.get();
    }
});

//
