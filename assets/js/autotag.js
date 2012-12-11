var autotag = {
	init: function(){
		var color = ['#8431cf', '#1332df', '#f00122', '#8c4211', '#de3f90', '#666', '#05d30d', '#e957ea', '#007aad', '#f00'];
		var size = ['16px', '25px','19px','17px'];
		$("#tagDiv").find('a').each(function(i,e){ 
			$(e).css('color', color[autotag.rand(color.length)]);
			$(e).css('font-size', size[autotag.rand(size.length)]);
		});
	},
	rand: function(arraylen){
		return Math.floor(Math.random()*arraylen);
	}
}
