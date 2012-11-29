var autotag = {
	init: function(){
		var color = ['red', 'green', 'blue'];
		var size = ['10px', '12px','14px','16px'];
		$("#tagDiv").find('a').each(function(i,e){ 
			$(e).css('color', color[autotag.rand(color.length)]);
			$(e).css('font-size', size[autotag.rand(size.length)]);
		});
	},
	rand: function(arraylen){
		Math.floor(Math.random()*arraylen);
	}
}
