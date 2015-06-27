/*
 * @author qiqiboy
 * @github https://github.com/qiqiboy/CMask
 */
;
(function(ROOT, struct, undefined){
    "use strict";

    var lastTime=0,
        nextFrame=ROOT.requestAnimationFrame ||
            ROOT.webkitRequestAnimationFrame ||
            ROOT.mozRequestAnimationFrame ||
            ROOT.msRequestAnimationFrame ||
            function(callback){
                var currTime=+new Date,
                    delay=Math.max(1000/60,1000/60-(currTime-lastTime));
                lastTime=currTime+delay;
                return setTimeout(callback,delay);
            },
        states={
            start:1,
            down:1,
            move:2,
            end:3,
            up:3,
            cancel:3
        },
        evs=[],
        slice=[].slice,
        event2type={},
        event2code={},
        POINTERS={},
        dpr=ROOT.devicePixelRatio||1;

    typeof [].forEach=='function' && "mouse touch pointer MSPointer-".split(" ").forEach(function(prefix){
        var _prefix=/pointer/i.test(prefix)?'pointer':prefix;
        Object.keys(states).forEach(function(endfix){
            var code=states[endfix],
                ev=camelCase(prefix+endfix);
            evs.push(ev);
            POINTERS[_prefix]={};
            event2type[ev.toLowerCase()]=_prefix;
            event2code[ev.toLowerCase()]=code;
        });
    });

    function camelCase(str){
        return (str+'').replace(/-([a-z]|[0-9])/ig, function(all,letter){
            return (letter+'').toUpperCase();
        });
    }

    function filterEvent(oldEvent){
         var ev={},
             eventtype,
             pointers,
             pointer;

        ev.oldEvent=oldEvent;
        ev.type=oldEvent.type.toLowerCase();
        ev.eventType=event2type[ev.type]||ev.type;
        ev.eventCode=event2code[ev.type]||0;
        ev.preventDefault=function(){
            oldEvent.preventDefault();
        }

        pointers=POINTERS[ev.eventType];
        switch(ev.eventType){
            case 'mouse':
            case 'pointer':
                var id=oldEvent.pointerId||0;
                ev.eventCode==3?delete pointers[id]:pointers[id]=oldEvent;
                ev.changedPointers=[{id:id,ev:oldEvent}];
                break;
            case 'touch':
                ev.changedPointers=slice.call(oldEvent.changedTouches).map(function(pointer){
                    return {id:pointer.identifier,ev:pointer};
                });
                POINTERS[ev.eventType]=pointers=slice.call(oldEvent.touches);
                break;
        }

        if(pointer=pointers[Object.keys(pointers)[0]]){
            ev.clientX=pointer.clientX;
            ev.clientY=pointer.clientY;
        }

        ev.length=Object.keys(pointers).length;

        return ev;
    }

    struct.prototype={
        constructor:struct,
        init:function(width,height,lineWidth){
            this.events={};
            this.canvas=document.createElement('canvas');
            this.ctx=this.canvas.getContext('2d');
            this.canvas.className='cmask';

            this.width=width||300;
            this.height=height||400;
            this.lineWidth=lineWidth||20;
            
            this.ctx.fillStyle='grey';
            this.ctx.fillRect(0,0,this.width,this.height);

            evs.forEach(function(ev){
                this.canvas.addEventListener(ev, this, false);
            }.bind(this));
            
            var _x,_y;

            this.on({
                start:function(x,y){
                    _x=x;_y=y;
                },
                move:function(x,y){
                    var w=this.lineWidth/4,
                        z=Math.sqrt(Math.pow(x-_x,2)+Math.pow(y-_y,2)),
                        off=z;
                    while(off>0){
                        this.clear(x-off/z*(x-_x),y-off/z*(y-_y));
                        off-=w;
                    }
                    _x=x;_y=y;
                },
                end:function(){
                    _x=_y=null;
                }
            });
        },
        handleEvent:function(oldEvent){
            var ev=filterEvent(oldEvent),
                rect=this.canvas.getBoundingClientRect(),
                isRight=!this.pointerType||this.pointerType==ev.eventType;

            switch(ev.eventCode){
                case 2:
                    if(isRight&&this.moving){
                        ev.preventDefault();
                        this.fire('move',(ev.clientX-rect.left)*this.width/rect.width,(ev.clientY-rect.top)*this.height/rect.height);
                    }
                    break;
                
                case 1:
                    if(!this.pointerType){
                        clearTimeout(this.eventTimer);
                        this.pointerType=ev.eventType;
                    }
                case 3:
                    if(ev.length==1){
                        this.fire('start',(ev.clientX-rect.left)*this.width/rect.width,(ev.clientY-rect.top)*this.height/rect.height);
                        this.moving=true;
                    }else{
                        this.fire('end');
                        delete this.moving;
                        delete this.pointerType;
                    }
                    if(!ev.length){
                        this.eventTimer=setTimeout(function(){
                            delete this.pointerType;
                        }.bind(this),30);
                    }
                    break;
            }
        },
        on:function(ev,callback){
            if(typeof ev == 'object'){
                Object.keys(ev).forEach(function(_e){
                    this.on(_e,ev[_e]);
                }.bind(this));
            }else{
                if(!this.events[ev]){
                    this.events[ev]=[];
                }
                this.events[ev].push(callback);
            }
            return this;
        },
        fire:function(ev){
            var args=[].slice.call(arguments,1);
            (this.events[ev]||[]).forEach(function(callback){
                if(typeof callback == 'function'){
                    callback.apply(this,args);
                }
            }.bind(this));
            return this;
        },
        getPercent:function() {
            var pixles=this.ctx.getImageData(0,0,this.width,this.height).data,
                length=pixles.length,
                i=0,clen=0;
            for(;i<length;i+=4){
                if(pixles[i+3]<128){
                    clen++;
                }
            }
            
            return parseFloat((clen/length*4).toFixed(4));
        },
        clear:function(x,y,w){
            var ctx=this.ctx,
                gdt;
            w=w||this.lineWidth;
            gdt=ctx.createRadialGradient(x,y,0,x,y,w/2);
            gdt.addColorStop(0,'rgba(0, 0, 0, 1)');
            gdt.addColorStop(1,'rgba(255, 255, 255, 0)');
            ctx.fillStyle=gdt;
            ctx.globalCompositeOperation='destination-out';
            ctx.beginPath();
            ctx.arc(x,y,w/2,0,Math.PI*2,false);
            ctx.closePath();
            ctx.fill();
            return this;
        },
        destroy:function(){
            var duration=400,
                start=Date.now(),
                width=this.width,
                height=this.height,
                ani=function(){
                    var offset=Date.now()-start;
                    if(offset<duration){
                        this.clear(width/2,height/2,offset/duration*Math.max(width,height)*2);
                        nextFrame(ani.bind(this));
                    }else{
                        this.canvas.parentNode.removeChild(this.canvas);
                    }
                }

            ani.call(this);
            return this;
        }
    }

    if(typeof Object.defineProperties=='function'){
        
        "width height".split(" ").forEach(function(prop){
            Object.defineProperty(struct.prototype,prop,{
                get:function(){
                    return this.canvas[prop]/dpr;
                },
                set:function(value){
                    this.canvas[prop]=value*dpr;
                    this.ctx.scale(dpr,dpr);//retina support
                },
                enumerable:true
            });
        });

        Object.defineProperty(struct.prototype,'percent',{
            get:function(){
                return this.getPercent();
            },
            enumerable:true
        });

    }

    ROOT.CMask=struct;
    
})(window, function(width,height,lineWidth){
    if(!(this instanceof arguments.callee)){
        return new arguments.callee(width,height,lineWidth);
    }
    this.init(width,height,lineWidth);
});
