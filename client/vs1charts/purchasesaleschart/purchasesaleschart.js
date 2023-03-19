import {VS1ChartService} from "../vs1charts-service";
import 'jQuery.print/jQuery.print.js';
import {UtilityService} from "../../utility-service";
import "../../lib/global/indexdbstorage.js";

let _ = require('lodash');
let vs1chartService = new VS1ChartService();
let utilityService = new UtilityService();
const _tabGroup = 1;

Template.purchasesaleschart.onCreated(()=>{
    const templateObject = Template.instance();
    templateObject.records = new ReactiveVar([]);
    templateObject.dateAsAt = new ReactiveVar();
    templateObject.deptrecords = new ReactiveVar();

    templateObject.salesperc = new ReactiveVar();
    templateObject.expenseperc = new ReactiveVar();
    templateObject.salespercTotal = new ReactiveVar();
    templateObject.expensepercTotal = new ReactiveVar();
});

Template.purchasesaleschart.onRendered(()=>{

    const templateObject = Template.instance();
    let utilityService = new UtilityService();
    let salesOrderTable;
    var splashArray = new Array();
    var today = moment().format('DD/MM/YYYY');
    var currentDate = new Date();
    var begunDate = moment(currentDate).format("DD/MM/YYYY");
    let fromDateMonth = (currentDate.getMonth() + 1);
    let fromDateDay = currentDate.getDate();
    if((currentDate.getMonth()+1) < 10){
        fromDateMonth = "0" + (currentDate.getMonth()+1);
    }

    if(currentDate.getDate() < 10){
        fromDateDay = "0" + currentDate.getDate();
    }
    var fromDate =fromDateDay + "/" +(fromDateMonth) + "/" + currentDate.getFullYear();

    templateObject.dateAsAt.set(begunDate);
    const dataTableList = [];
    const deptrecords = [];
    if ((!localStorage.getItem('VS1OutstandingInvoiceAmt_dash'))&&(!localStorage.getItem('VS1OutstandingPayablesAmt_dash'))) {
        vs1chartService.getOverviewARDetails().then(function (data) {
            let itemsAwaitingPaymentcount = [];
            let itemsOverduePaymentcount = [];
            let dataListAwaitingCust = {};
            let totAmount = 0;
            let totAmountOverDue = 0;
            let customerawaitingpaymentCount = '';
            Session.setPersistent('myMonthlyErnings', data);
            for(let i=0; i<data.tarreport.length; i++){
                dataListAwaitingCust = {
                    id: data.tarreport[i].ClientID || '',
                };
                if(data.tarreport[i].AmountDue != 0){
                    itemsAwaitingPaymentcount.push(dataListAwaitingCust);
                    totAmount += Number(data.tarreport[i].AmountDue);
                    let date = new Date(data.tarreport[i].DueDate);
                    let totOverdueLine = Number(data.tarreport[i].AmountDue) - Number(data.tarreport[i].Current)||0;
                    //if (date < new Date()) {
                        itemsOverduePaymentcount.push(dataListAwaitingCust);
                        totAmountOverDue +=totOverdueLine;
                    //}
                }

            }
            $('#custAwaiting').text(itemsAwaitingPaymentcount.length);
            $('.oustandingInvQty').text(itemsOverduePaymentcount.length);
            if (!isNaN(totAmount)) {
                $('.custAwaitingAmt').text(utilityService.modifynegativeCurrencyFormat(totAmount));
            }else{
                $('.custAwaitingAmt').text(Currency+'0.00');
            }

            if (!isNaN(totAmountOverDue)) {
                $('.oustandaingInvAmt').text(utilityService.modifynegativeCurrencyFormat(totAmountOverDue));
            }else{
                $('.oustandaingInvAmt').text(Currency+'0.00');
            }


            if(itemsAwaitingPaymentcount.length){
                templateObject.awaitingpaymentCount.set(itemsAwaitingPaymentcount.length);
            }

        });
        // Session.setPersistent('myExpenses', '');
        vs1chartService.getOverviewAPDetails().then(function (data) {
            let itemsSuppAwaitingPaymentcount = [];
            let itemsSuppOverduePaymentcount = [];
            let dataListAwaitingSupp = {};
            let customerawaitingpaymentCount = '';
            let supptotAmount = 0;
            let supptotAmountOverDue = 0;
            Session.setPersistent('myExpenses', data);
            for(let i=0; i<data.tapreport.length; i++){
                dataListAwaitingSupp = {
                    id: data.tapreport[i].ClientID || '',
                };
                if(data.tapreport[i].AmountDue != 0){
                    // supptotAmount = data.tpurchaseorder[i].TotalBalance + data.tpurchaseorder[i].TotalBalance;
                    supptotAmount += Number(data.tapreport[i].AmountDue);
                    itemsSuppAwaitingPaymentcount.push(dataListAwaitingSupp);
                    let date = new Date(data.tapreport[i].DueDate);
                    let supptotAmountOverDueLine = Number(data.tapreport[i].AmountDue) - Number(data.tapreport[i].Current)||0;
                    //if (date < new Date()) {
                        supptotAmountOverDue += supptotAmountOverDueLine;
                        itemsSuppOverduePaymentcount.push(dataListAwaitingSupp);
                    //}
                }

            }
            $('.suppAwaiting').text(itemsSuppAwaitingPaymentcount.length);
            $('#suppOverdue').text(itemsSuppOverduePaymentcount.length);

            if (!isNaN(supptotAmount)) {
                $('.suppAwaitingAmtdash').text(utilityService.modifynegativeCurrencyFormat(supptotAmount));
            }else{
                $('.suppAwaitingAmtdash').text(Currency+'0.00');
            }

            if (!isNaN(supptotAmountOverDue)) {
                $('.suppOverdueAmt').text(utilityService.modifynegativeCurrencyFormat(supptotAmountOverDue));
            }else{
                $('.suppOverdueAmt').text(Currency+'0.00');
            }


            // templateObject.awaitingpaymentCount.set(itemsAwaitingPaymentcount.length);
        });
    }else{
        let totInvQty = localStorage.getItem('VS1OutstandingInvoiceQty_dash')||0;
        let totInvAmountOverDue = localStorage.getItem('VS1OutstandingInvoiceAmt_dash')||0;

        let supptotQty = localStorage.getItem('VS1OutstandingPayablesQty_dash')||0;
        let supptotAmountOverDue = localStorage.getItem('VS1OutstandingPayablesAmt_dash')||0;

        $('.oustandingInvQty').text(totInvQty);
        if (!isNaN(totInvAmountOverDue)) {
            $('.oustandaingInvAmt').text(utilityService.modifynegativeCurrencyFormat(totInvAmountOverDue));
        }else{
            $('.oustandaingInvAmt').text(Currency+'0.00');
        }
        $('.suppAwaiting').text(supptotQty);
        if (!isNaN(supptotAmountOverDue)) {
            $('.suppAwaitingAmtdash').text(utilityService.modifynegativeCurrencyFormat(supptotAmountOverDue));
        }else{
            $('.suppAwaitingAmtdash').text(Currency+'0.00');
        }


    }

});

Template.purchasesaleschart.helpers({
    dateAsAt: () =>{
        return Template.instance().dateAsAt.get() || '-';
    },
    companyname: () =>{
        return loggedCompany;
    },
    salesperc: () =>{
        return Template.instance().salesperc.get() || 0;
    },
    expenseperc: () =>{
        return Template.instance().expenseperc.get() || 0;
    },
    salespercTotal: () =>{
        return Template.instance().salespercTotal.get() || 0;
    },
    expensepercTotal: () =>{
        return Template.instance().expensepercTotal.get() || 0;
    }
});

Template.purchasesaleschart.events({
    'click .overdueInvoiceAmt':function(event){
        FlowRouter.go('/agedreceivablessummary');
    },
    'click .overdueInvoiceQty':function(event){
        FlowRouter.go('/agedreceivables');
    },
    'click .outstaningPayablesAmt':function(event){
        FlowRouter.go('/agedpayablessummary');
    },
    'click .outstaningPayablesQty':function(event){
        FlowRouter.go('/agedpayables');
    },
});

Template.registerHelper('equals', function (a, b) {
    return a === b;
});

Template.registerHelper('notEquals', function (a, b) {
    return a != b;
});

Template.registerHelper('containsequals', function (a, b) {
    return (a.indexOf(b) >= 0 );
});
