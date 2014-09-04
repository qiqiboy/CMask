CMask
=====

javascript涂抹、刮奖scratch效果组件，Scratch Pad

## 如何使用
```javascript
// 首先在页面中引入cmask.js
// 实例化一个CMask对象

// @Class CMask
// @param int width 画布宽度
// @param int height 画布高度
// @param int lineWidth 涂抹线条宽度

var mask=new CMask(400,600,30); 
document.body.appendChild(mask.canvas); //将画布放到页面中，然后可以通过css指定canvas的样式、大小、位置

// @event 
// 每个CMask对象支持三种事件绑定：
// start 开始涂抹
// move 涂抹中
// end 涂抹结束

mask.on('start',function(){
	console.log('开始涂抹了');
});
mask.on('move',function(){
	console.log('正在涂抹');
});
mask.on('end',function(){
	console.log('涂抹结束');
	if(this.percent>0.8){//清除区域大于80%
		this.destroy();
		//其它操作
	}
});

// @method
mask.destroy(); //以动画方式清除整个蒙版遮罩
mask.getPercent(); //获取已清理区域占比

````

## DEMO 
http://u.boy.im/cmask
