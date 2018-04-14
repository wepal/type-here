var _typingNodes = [];
var _typingEndOffset;
var _typingPos;

var _typingBar = document.createElement('div');
_typingBar.style.cssText = "height: 40px; position: fixed; bottom:0%; width:100%; background-color: #65ff25; z-index: 100000";
document.body.appendChild(_typingBar);  

var _cursor = document.createElement('div');
_cursor.style.cssText = "position:absolute;background-color: #00f;color: #fff; z-index: 100002";
document.body.appendChild(_cursor);  

document.addEventListener('keypress', function(event){
    if(_typingNodes.length===0){
        return; //not typing
    }
    event.preventDefault();
    select();
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
    if(_typingPos + 1 < node.nodeValue.length){
        _typingPos = _typingPos + 1;
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
    checkFinished();
    select();
});

function setFontStyle(div){
    var el = _typingNodes[0].parentElement;
    var style = window.getComputedStyle(el);
    var props=['font-family','font-size','font-stretch','font-style',
        'font-variant','font-weight']
    for(var i=0;i<props.length;i++){
        div.style[props[i]] = style[props[i]]        
    }
}

function markError(expected){
    var div = document.createElement('div');
    div.textContent = expected;
    div.style.cssText = "position:absolute;background-color: #f00;color: #fff;z-index: 100001";
    setDivRect(div);
    setFontStyle(div);
    document.body.appendChild(div);  
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

function select(){
    var node = _typingNodes[0];
    var expected = node.nodeValue[_typingPos];
    _cursor.textContent = expected;
    setDivRect(_cursor);
    setFontStyle(_cursor);    
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
        select();
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
