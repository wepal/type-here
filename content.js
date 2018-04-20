"use strict";

var _observer;
var _chars = [];
var _pos;
var _cursor;
var _allowedChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ 1234567890,.-;:_öäüÖÄÜ";
var _keyListener;
var _resizeListener;
var _idPrefix = "typeHereExtension_";

function barMessage(text){
    var message = document.getElementById(_idPrefix+"message");
    message.textContent = text;
}

function createTypingBar(){
    if(document.getElementById(_idPrefix+"bar")){
        return;
    }
    var bar = document.createElement('div');
    bar.id = _idPrefix+"bar";
    bar.style.cssText = "all: unset; height: 40px; position: fixed; bottom:0%; width:100%; background-color: #65ff25; z-index: 100000";
    document.body.appendChild(bar);  
    
    var message = document.createElement('div');
    message.id = _idPrefix+"message";
    message.style.cssText = "all: unset";
    bar.appendChild(message);    
    
    var text = document.createElement('div');
    text.id = _idPrefix+"text";
    text.style.cssText = "all: unset";
    bar.appendChild(text);      
    
    var preText = document.createElement('div');
    preText.id = _idPrefix+"preText";
    preText.style.cssText = "all: unset;color:#555;background-color:#0000";
    text.appendChild(preText);  
    
    var curText = document.createElement('div');
    curText.id = _idPrefix+"curText";
    curText.style.cssText = "all: unset;color:#fff;background-color:#00f";
    text.appendChild(curText);  
    
    var postText = document.createElement('div');
    postText.id = _idPrefix+"postText";
    postText.style.cssText = "all: unset;color:#555;background-color:#0000";
    text.appendChild(postText);  
}

function onKey(pressed){
    var expected = _chars[_pos].character;
    if(pressed != expected){
        barMessage("expected ["+expected+"], pressed ["+pressed+"]");
        if(_chars[_pos].error === undefined){
            createErrorDiv();            
        }
        updateCursor(true);
        updateTypingBarText();
        return;
    }
    _pos++;
    if(_pos>=_chars.length){
        barMessage("finished:-)");
        _chars = [];
        _pos = undefined;        
    }
    updateCursor();
    updateTypingBarText();
}

function updateTypingBarText(){
    var textEl = document.getElementById(_idPrefix+"text");
    if(_pos===undefined){
        document.getElementById(_idPrefix+"text").style.visibility = "hidden";
        return;
    }
    document.getElementById(_idPrefix+"text").style.visibility = "visible";
    var start = Math.max(0,_pos-10);
    var end = Math.min(_chars.length,_pos+10);
    var preText="";
    for(var i=start;i<_pos;i++){
        preText = preText+_chars[i].character;
    }
    document.getElementById(_idPrefix+"preText").textContent = preText;
    var postText="";
    for(var i=_pos+1;i<end;i++){
        postText = postText+_chars[i].character;
    }
    document.getElementById(_idPrefix+"postText").textContent = postText;
    document.getElementById(_idPrefix+"curText").textContent = _chars[_pos].character;
}

function createCursor(){
    if(_cursor!==undefined){
        document.body.removeChild(_cursor);
    }
    _cursor = document.createElement('div');
    _cursor.style.cssText = "all:unset;position:absolute;background-color:#33f;color:#fff;z-index: 100002;line-height:normal;visibility:visible";
    document.body.appendChild(_cursor);  
}

function createErrorDiv(){
    var div = document.createElement('div');
    div.style.cssText = "all: unset;position:absolute;background-color: #f80;color: #000;z-index: 100001;line-height:normal";
    updateCharOverlay(div, _pos);
    document.body.appendChild(div);  
    _chars[_pos].error = div;
}

function updateAll(){
    for(var i=0;i<_chars.length;i++){
        var c = _chars[i];
        if(c.error===undefined){
            continue;
        }
        updateCharOverlay(c.error, i);
    }
    updateCursor();
}

function periodicUpdateAll(){
    updateAll();
    window.setTimeout(periodicUpdateAll, 1000);
}

function rectFromChar(pos){
    var c = _chars[pos];
    var range = document.createRange();
    range.setStart(c.node,c.nodeOffset)
    range.setEnd(c.node,c.nodeOffset+1)
    var rect = range.getBoundingClientRect();
    range.detach();
    
    if(c.character===" " && pos>0 && _chars[pos-1]!==" "){
        var rectLeft=rectFromChar(pos-1);
        if(rect.height>rectLeft.height){
            var r = {};
            r.left = rectLeft.left+rectLeft.width;
            r.top = rectLeft.top;
            r.width = rectLeft.width;
            r.height = rectLeft.height;
            return r;
        }
    }
    return rect;    
}

function updateCharOverlay(div, pos){
    if(pos>=_chars.length){
        console.error("bad pos");
        return;
    }
    var c = _chars[pos];
    var rect = rectFromChar(pos);
    div.style.left = (rect.left + window.scrollX) + "px";
    div.style.top = (rect.top + window.scrollY) + "px";
    div.style.width = rect.width + "px";
    div.style.height = rect.height + "px";
    
    var el = c.node.parentElement;
    var style = window.getComputedStyle(el);
    var props=['font-family','font-size','font-stretch','font-style',
        'font-variant','font-weight']
    for(var i=0;i<props.length;i++){
        div.style[props[i]] = style[props[i]]        
    }
    
    div.textContent = c.character;
}

function updateCursor(error = false){
    if(_cursor===undefined){
        createCursor();
    }
    if(_pos===undefined || _pos>=_chars.length){
        _cursor.style.visibility = "hidden";
        return
    }
    if(error){
        createCursor();
        _cursor.style['background-color']="#f00";      
        _cursor.style['animation'] = "cursorBlink 200ms steps(2) 0s 3 normal";        
    }else{
        _cursor.style['background-color']="#33f";       
    }
    _cursor.style.visibility = "visible";
    updateCharOverlay(_cursor, _pos);
}

function getNodes(parent){
    var nodes=[parent];
    for(var i=0;i<parent.childNodes.length;i++){
        var child = parent.childNodes[i];
        var c = getNodes(child);
        for(var j=0;j<c.length;j++){
            nodes.push(c[j]);
        }
    }
    return nodes;
}

function createKeyListener(){
    _keyListener = function(event){
        if(_chars.length===0){
            return; //not typing
        }
        event.preventDefault();
        onKey(String.fromCharCode(event.charCode));
    };
    document.addEventListener('keypress', _keyListener);
}

function createResizeListener(){
    _resizeListener = function(event){
        updateAll();
    };
    window.addEventListener('resize', _resizeListener);    
}

function charsFromRange(range){
    if(range.startContainer.nodeType !== Node.TEXT_NODE
    ||range.endContainer.nodeType !== Node.TEXT_NODE){
        console.error("need text nodes");
        return [];
    }
    var container = range.commonAncestorContainer;
    var nodes = getNodes(container);
    var charNodes = [range.startContainer];
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if(node.nodeType === Node.TEXT_NODE
            && node.nodeValue.length > 0
            && range.isPointInRange(node, 0)
            && range.isPointInRange(node, node.nodeValue.length-1)
            && node!==range.startContainer
            && node!==range.endContainer){
            charNodes.push(node);
        }
    }
    if(range.endContainer!=range.startContainer){
        charNodes.push(range.endContainer);            
    }
    
    var chars = [];    
    for (var i = 0; i < charNodes.length; i++) {
        var node = charNodes[i];
        var text = node.nodeValue;
        var start = 0;
        var end = text.length;
        if(node===range.startContainer){
            start = range.startOffset;
        }
        if(node===range.endContainer){
            end = range.endOffset;
        }
        for (var j = start; j < end; j++) {
            if(_allowedChars.indexOf(text[j])==-1){
                continue;
            }        
            var c = {};
            c.character = text[j];
            c.node = node;
            c.nodeOffset = j;
            c.error = undefined;
            chars.push(c);
        }
    }
    return chars;
}

function start(){
    createTypingBar();
    if(_keyListener===undefined){
        createKeyListener();
    }
    if(_resizeListener===undefined){
        createResizeListener();
    }
    var sel = window.getSelection();
    var range = sel.getRangeAt(0);
    _chars = charsFromRange(range);
    _pos = 0;    
    createObserver(range.commonAncestorContainer);
    updateTypingBarText();
    updateCursor();
    periodicUpdateAll(); 
    window.getSelection().removeAllRanges();
    console.log("started typing");    
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request == "typeHere"){   
        start();    
    }
  }
);

function createObserver(node){
    var config = { attributes: true, childList: true, characterData: true, subtree: true };
    var callback = function(mutationRecords) {
        console.log("mutation detected");
        //TODO do something:-)
        for(var mutationRecord of mutationRecords) {
        }
    };
    _observer = new MutationObserver(callback);
    _observer.observe(node, config);
}
