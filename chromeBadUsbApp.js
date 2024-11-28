// import modules
let eventLoop = require("event_loop");
let gui = require("gui");
let submenuView = require("gui/submenu");
let notify = require("notification");
let textInputView = require("gui/text_input");
let dialogView = require("gui/dialog");
let flipper = require("flipper");
let badusb = require("badusb");
let currentWord = undefined;

// declare view instances
let views = {
    keyboard: textInputView.makeWith({
        header: "Enter word:",
        minLength: 0,
        maxLength: 30,
        defaultText: "",
        defaultTextClear: true,
    }),
    startDialog: dialogView.make(),
    doneSetWordDialog: dialogView.make(),
    menu: submenuView.makeWith({
        header: "Chrome Badusb App",
        items: [
            "Set word",
            "Start",
        ],
    }),
};

badusb.setup({
    vid: 0xAAAA,
    pid: 0xBBBB,
    mfrName: "Flipper",
    prodName: "Zero",
    layoutPath: "/ext/badusb/assets/layouts/en-US.kl"
});
eventLoop.subscribe(views.menu.chosen, function (_sub, index, gui, eventLoop, views) {
    if (index === 0) {
        gui.viewDispatcher.switchTo(views.keyboard);
    }else if(index === 1){
        views.startDialog.set("text", "Chrome Typer");
        views.startDialog.set("center","Start");
        gui.viewDispatcher.switchTo(views.startDialog);
    }
}, gui, eventLoop, views);


eventLoop.subscribe(views.keyboard.input, function(_sub, word, gui, views){
    views.doneSetWordDialog.set("text","Word is now " + word);
    views.doneSetWordDialog.set("center","Go back");
    currentWord = word;
    gui.viewDispatcher.switchTo(views.doneSetWordDialog);
},gui,views);


eventLoop.subscribe(views.doneSetWordDialog.input, function (_sub, button, gui, views) {
    if (button === "center")
        gui.viewDispatcher.switchTo(views.menu);
}, gui, views);


eventLoop.subscribe(gui.viewDispatcher.navigation, function (_sub, _, gui, views, eventLoop) {
    if (gui.viewDispatcher.currentView === views.menu) {
        eventLoop.stop();
        return;
    }
    gui.viewDispatcher.switchTo(views.menu);
}, gui, views, eventLoop);

eventLoop.subscribe(views.startDialog.input, function (_sub, button, gui, views) {
    if (badusb.isConnected()) {
        if (currentWord === undefined) {
            views.startDialog.set("text", "No word selected");
            views.startDialog.set("center","");
        }
        notify.blink("green", "short");
        views.startDialog.set("text", "Running...");
        views.startDialog.set("center","");
        badusb.press("GUI","r");
        delay(1500);
        badusb.print("chrome");
        badusb.press("ENTER");
        delay(2000);
        badusb.press("TAB");
        badusb.press("ENTER");
        delay(1000);
        badusb.press("CTRL","t");
        delay(1500);
        badusb.print(currentWord);
        notify.success();
        views.startDialog.set("text", "Finished");
        views.startDialog.set("center","Redo");
    } else {
        print("USB not connected");
        notify.error();
    }
    return;
    
}, gui, views);



// run UI
gui.viewDispatcher.switchTo(views.menu);
eventLoop.run();
