/*
 * @author qiqiboy
 * @github https://github.com/qiqiboy/CMask
 */
;
(function(ROOT, struct, undefined){
	"use strict";

    if(typeof Function.prototype.bind!='function'){
        Function.prototype.bind=function(obj){
            var self=this;
            return function(){
                return self.apply(obj,arguments)
            }
        }
    }
    
    struct.prototype={
        constructor:struct,
        percent:0,
        init:function(width,height,lineWidth){
            this.events={};
            this.canvas=document.createElement('canvas');
            this.ctx=this.canvas.getContext('2d');
            this.canvas.width=width||300;
            this.canvas.height=height||400;
            this.lineWidth=lineWidth||20;

            "mousedown mousemove mouseup touchstart touchmove touchend touchcancel pointerdown pointermove pointerup pointercancel".split(" ").forEach(function(ev){
                this.canvas.addEventListener(ev, this, false);
            }.bind(this));

            this.on({
                start:this.clear,
                move:this.clear,
                end:this.getPercent
            });
        },
        handleEvent:function(ev){
            var x=ev.clientX||0,
                y=ev.clientY||0,
                rect=this.canvas.getBoundingClientRect();
            if(ev.touches && ev.touches.length){
                if(ev.touches.length>1){//多指触摸不作响应
                    return;
                }
                x=ev.touches.item(0).clientX;
                y=ev.touches.item(0).clientY;
            }
            x-=rect.left;
            y-=rect.top;

            x*=this.canvas.width/rect.width;
            y*=this.canvas.height/rect.height;

            switch(ev.type.toLowerCase()){
                case 'mousedown':
                case 'touchstart':
                case 'pointerdown':
                    this.moving=true;
                    this.fire('start',x,y);
                    break;
                case 'mousemove':
                case 'touchmove':
                case 'pointermove':
                    if(this.moving){
                        this.fire('move',x,y);
                    }
                    break;
                case 'mouseup':
                case 'touchend':
                case 'touchcancel':
                case 'pointerup':
                case 'pointercancel':
                    if(this.moving){
                        delete this.moving;
                        this.fire('end');
                    }
                    break;
            }
        },
        on:function(ev,callback){
            if(typeof ev == 'object'){
                return Object.keys(ev).forEach(function(_e){
                    this.on(_e,ev[_e]);
                }.bind(this));
            }
            if(!this.events[ev]){
                this.events[ev]=[];
            }
            this.events[ev].push(callback);
        },
        fire:function(ev){
            var args=[].slice.call(arguments,1);
            (this.events[ev]||[]).forEach(function(callback){
                if(typeof callback == 'function'){
                    callback.apply(this,args);
                }
            }.bind(this));
        },
        getPercent:function() {
            var pixles=this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height).data,
                length=pixles.length,
                i=0,clen=0;
            for(;i<length;i+=4){
                if(pixles[i+3]<128){
                    clen++;
                }
            }
            
            return this.percent=(clen/length*4).toFixed(4);
        },
        clear:function(x,y,w){
            var ctx=this.ctx,
                gdt;
            w=w||this.lineWidth;
            gdt=ctx.createRadialGradient(x,y,0,x,y,w);
            gdt.addColorStop(0,'rgba(0, 0 ,0, .5)');
            gdt.addColorStop(1,'rgba(255, 255, 255, 0)');
            ctx.fillStyle=gdt;
            ctx.globalCompositeOperation='destination-out';
            ctx.beginPath();
            ctx.arc(x,y,w,0,Math.PI*2,false);
            ctx.closePath();
            ctx.fill();
        },
        destroy:function(){
            var duration=400,
                start=Date.now(),
                width=this.canvas.width,
                height=this.canvas.height,
                ani=function(){
                    var offset=Date.now()-start;
                    if(offset<duration){
                        this.clear(width/2,height/2,offset/duration*Math.max(width,height));
                        setTimeout(ani.bind(this),30);
                    }else{
                        this.canvas.parentNode.removeChild(this.canvas);
                    }
                }

            ani.call(this);
        }
    }

    ROOT.CMask=struct;
    
})(window, function(width,height,lineWidth){
    if(!(this instanceof arguments.callee)){
		return new arguments.callee(width,height,lineWidth);
	}
    this.init(width,height,lineWidth);
});