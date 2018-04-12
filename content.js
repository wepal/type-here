var _typingNodes = [];
var _typingEndOffset;
var _typingPos;

var _typingBar = document.createElement('div');
_typingBar.style.cssText = "height: 40px; position: fixed; bottom:0%; width:100%; background-color: #65ff25; z-index: 100000";
document.body.appendChild(_typingBar);  

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
        markError();
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

function markError(){
    var node = _typingNodes[0];
    var text = node.nodeValue;
    node.nodeValue = text.substr(_typingPos+1); //TODO empty?
    if(_typingNodes.length==1){
        _typingEndOffset -= (_typingPos+1);
        console.log("_typingEndOffset "+_typingEndOffset)
    }
    if(_typingPos>0){
        var part1text = text.substr(0,_typingPos);
        var part1 = document.createTextNode(part1text);
        node.parentNode.insertBefore(part1, node);        
    }
    var span = document.createElement("span");
    span.textContent = text[_typingPos];
    span.style.backgroundColor = "red";
    node.parentNode.insertBefore(span, node);
    _typingNodes.unshift(span.childNodes[0]);
    _typingPos=0;
    popEmpty();
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

function select(){
    var sel = window.getSelection();
    sel.removeAllRanges();
    if(_typingNodes.length===0){
        return;
    }
    var range = document.createRange();
    range.setStart(_typingNodes[0],_typingPos)
    range.setEnd(_typingNodes[0],_typingPos+1)
    sel.addRange(range);    
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
