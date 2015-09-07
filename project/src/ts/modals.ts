import m = require('mithril');
import DatePicker = require('datepicker');
import TimePicker = require('timepicker');
import Alert = require('alert');
import Toolkit = require('toolkit');

export type Ctrl = {
  alert: Alert.Ctrl;
  timePicker: TimePicker.Ctrl;
  datePicker: DatePicker.Ctrl;
}

function render(ctrl: Ctrl): m.VirtualElement<Ctrl>[] {
  var attrs = Toolkit.m.handleAttributes({ class: 'fade-in'}, (name, value) => {
    if((name + ':' + value) == 'class:fade-in') {
      return ctrl.alert.displayed() || ctrl.timePicker.displayed() || ctrl.datePicker.displayed();
    }
    return true;
  });

  return [m('div.modals', attrs,[
    Alert.component.view(ctrl.alert),
    DatePicker.component.view(ctrl.datePicker),
    TimePicker.component.view(ctrl.timePicker)
  ])];
}

export const component: m.Component<Ctrl> = {
  controller(): Ctrl {
    return {
      alert: Alert.component.controller(),
      timePicker: TimePicker.component.controller(),
      datePicker: DatePicker.component.controller()
    };
  },

  view(ctrl: Ctrl): m.VirtualElement<Ctrl>[] {
    return render(ctrl);
  }
}
