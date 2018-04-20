var _typingNodes = [];
var _typingEndOffset;
var _typingPos;

var _allowedChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ 1234567890,.-;:_öäüÖÄÜ";

var _typingBar = document.createElement('div');
_typingBar.style.cssText = "height: 40px; position: fixed; bottom:0%; width:100%; background-color: #65ff25; z-index: 100000";
document.body.appendChild(_typingBar);  

var _cursor;

document.addEventListener('keypress', function(event){
    if(_typingNodes.length===0){
        return; //not typing
    }
    event.preventDefault();
    var node = _typingNodes[0];
    var expected = node.nodeValue[_typingPos];
    var pressed = String.fromCharCode(event.charCode);
    if(pressed != expected){
        _typingBar.textContent = "expected ["+expected+"], pressed ["+pressed+"]";
        markError(expected);
        return;
    }
    if(checkFinished()){
        return;
    }
    while(true){
        next();
        if(checkFinished()){
            return;
        }
        var node = _typingNodes[0];
        var expected = node.nodeValue[_typingPos];
        var allowed = _allowedChars.indexOf(expected)!=-1;        
        if(allowed){
            break;
        }
    }
    checkFinished();
});

function next(){
    var node = _typingNodes[0];
    if(_typingPos + 1 < node.nodeValue.length){
        _typingPos = _typingPos + 1;
        updateCursor();
    }else{
        //end of node
        console.log("end of node");
        _typingNodes.shift();
        popEmpty();
        if(!checkFinished()){
            node = _typingNodes[0];
            _typingPos = 0;
        }
    }    
}

function setFontStyle(div){
    var el = _typingNodes[0].parentElement;
    var style = window.getComputedStyle(el);
    var props=['font-family','font-size','font-stretch','font-style',
        'font-variant','font-weight']
    for(var i=0;i<props.length;i++){
        div.style[props[i]] = style[props[i]]        
    }
}

function createCursor(){
    if(_cursor!==undefined){
        document.body.removeChild(_cursor);
    }
    _cursor = document.createElement('div');
    _cursor.style.cssText = "position:absolute;background-color:#33f;color:#fff;z-index: 100002;line-height:normal;visibility:hidden";
    _cursor.style['animation'] = "cursorBlink 250ms steps(2) 0s infinite normal";        
    document.body.appendChild(_cursor);  
}

function markError(expected){
    var div = document.createElement('div');
    div.textContent = expected;
    div.style.cssText = "position:absolute;background-color: #f80;color: #000;z-index: 100001;line-height:normal";
    setDivRect(div);
    setFontStyle(div);
    document.body.appendChild(div);  
    updateCursor(true);
}

function checkFinished(){
    popEmpty();
    if(_typingNodes.length==0
    ||(_typingNodes.length==1 && _typingPos == _typingEndOffset)){
        console.log("finished");
        _typingNodes = [];
        _typingEndOffset = undefined;
        _typingPos = undefined;
        return true;            
    }    
    return false;
}

function popEmpty(){
    while(_typingNodes.length>0 && _typingNodes[0].nodeValue.length==0){
        _typingNodes.shift()
    }
}

function setDivRect(div){
    if(_typingNodes.length===0){
        return;
    }
    var range = document.createRange();
    range.setStart(_typingNodes[0],_typingPos)
    range.setEnd(_typingNodes[0],_typingPos+1)
    var rect = range.getBoundingClientRect();
    range.detach();
    div.style.left = (rect.left + window.scrollX) + "px";
    div.style.top = (rect.top + window.scrollY) + "px";
    div.style.width = rect.width + "px";
    div.style.height = rect.height + "px";
}

function updateCursor(error = false){
    if(_cursor===undefined){
        createCursor();
    }
    if(_typingNodes.length==0){
        _cursor.style.visibility = "hidden";
        return
    }
    if(error){
        createCursor();
        _cursor.style['background-color']="#f00";      
        //_cursor.style['animation'] = "cursorBlink 200ms steps(2) 0s 3 normal";        
    }else{
        _cursor.style['background-color']="#33f";       
        //_cursor.style['animation'] = null;
    }
    _cursor.style.visibility = "visible";
    setDivRect(_cursor);
    setFontStyle(_cursor);    
    var node = _typingNodes[0];
    var expected = node.nodeValue[_typingPos];
    _cursor.textContent = expected;
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

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request == "typeHere"){
        //if(_contextMenuElement===undefined){
        //    return;
        //}
        //_contextMenuElement.style.color = "magenta";
        
        var sel = window.getSelection();
        var range = sel.getRangeAt(0);
        if(range.startContainer.nodeType !== Node.TEXT_NODE
        ||range.endContainer.nodeType !== Node.TEXT_NODE){
            console.error("need text nodes");
            return
        }
        var container = range.commonAncestorContainer;
        console.log("container "+container)
        var nodes = getNodes(container);
        _typingNodes = [range.startContainer];
        for (i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if(node.nodeType === Node.TEXT_NODE
                && node.nodeValue.length > 0
                && range.isPointInRange(node, 0)
                && range.isPointInRange(node, node.nodeValue.length-1)
                && node!==range.startContainer
                && node!==range.endContainer){
                _typingNodes.push(node);
            }
        }
        if(range.endContainer!=range.startContainer){
            _typingNodes.push(range.endContainer);            
        }
        _typingPos = range.startOffset;
        _typingEndOffset = range.endOffset;
        updateCursor();
        window.getSelection().removeAllRanges();
        console.log("started typing")
        
        /*document.designMode = "on";
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand("ForeColor", false, "red");
        document.designMode = "off";
        */
    }
  }
);
