import { TaxRateService } from "../../settings/settings-service";
import { ReactiveVar } from "meteor/reactive-var";
import { SideBarService } from "../../js/sidebar-service";
import "../../lib/global/indexdbstorage.js";
import { setCurrentCurrencySymbol } from "../../popUps/currnecypopup";
let sideBarService = new SideBarService();

Template.CurrencyWidget.onCreated(function () {
  const templateObject = Template.instance();
  templateObject.currencyData = new ReactiveVar();
});

Template.CurrencyWidget.onRendered(function () {

});

Template.CurrencyWidget.events({
  "click #sltCurrency": (event) => {
    $("#currencyModal").modal("toggle");
  },
  "click #tblCurrencyPopList tbody tr": (e) => {

    const rateType = $(".currency-js").attr("type"); // String "buy" | "sell"

    const currencySymbol = $(e.currentTarget).find('.colSymbol').text() || "N/A";
    setCurrentCurrencySymbol(currencySymbol);
    const currencyCode = $(e.currentTarget).find(".colCode").text();
    const currencyRate =
      rateType == "buy"
        ? $(e.currentTarget).find(".colBuyRate").text()
        : $(e.currentTarget).find(".colSellRate").text();

    $('#sltCurrency').attr('currency-symbol', currencySymbol);
    $("#sltCurrency").val(currencyCode);
    $("#sltCurrency").trigger("change");
    $("#exchange_rate").val(currencyRate);
    $("#exchange_rate").trigger("change");
    $("#currencyModal").modal("toggle");

    $("#tblCurrencyPopList_filter .form-control-sm").val("");

    setTimeout(function () {
      $(".btnRefreshCurrency").trigger("click");
      $(".fullScreenSpin").css("display", "none");
    }, 1000);
  },
});

Template.CurrencyWidget.helpers({
  isCurrencyEnable: () => {
    return Session.get("CloudUseForeignLicence");
  },
});


export const isCurrencyEnable = () => {
  return Session.get("CloudUseForeignLicence");
};
