var body = null;
var canvas = null;
var context = null;

var points = [];
var group_colours = ["rgba(255,0,0,1)","rgba(0,255,0,1)","rgba(0,0,255,1)", "rgba(0,255,255,1)", "rgba(255,0,255,1)", "rgba(255,255,0,1)"];

var buttons = {
				"list_of" : [
					{
						"text" : "draw();",
						"function" : null,
						"toggle" : null,
					},
					{
						"text" : "Randomise, k = 2",
						"function" : "console.log(points)",
						"toggle" : null,
					},
					{
						"text" : "alert('hello');",
						"function" : null,
						"toggle" : null,
					}
				],
				"setup" : function() {
					var buttonWrapper = document.getElementById("buttonWrapper");

					for (var i = this.list_of.length - 1; i >= 0; i--) {
						var button = document.createElement('button');
						button.type = "button";
						button.innerText = this.list_of[i].text;
						button.code = this.list_of[i].function || this.list_of[i].text;
						button.onclick = function() {eval(this.code)};
						buttonWrapper.appendChild(button);

					};
				},
				"catch_mouse_click" : function(click) {
					return;
				}

			};


var setup = function() {
	body = document.getElementById('body');
	canvas = document.getElementById('canvas');

	context = canvas.getContext("2d");
	
	canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

	canvas.onclick = function(a) {
		points.push(Point(a.offsetX, a.offsetY));
		draw();
	}

	buttons.setup();

};

var Point = function(x,y,group,colour) {
	return {
		"x":x || 0,
		"y":y || 0,
		"group": group || 0,
		"colour" : colour,
		"draw" : function() {
			context.save();
			context.fillStyle = context.strokeStyle = this.colour || group_colours[this.group];
			context.translate(this.x, this.y);
			context.beginPath();
			context.arc(0,0,2,0,2*Math.PI);
			context.stroke();
			context.fill();
			context.restore();
		},
		"draw_halo" : function(r, startcol, stopcol) {
			var grd=context.createRadialGradient(this.x,this.y,0,this.x,this.y,r);
			grd.addColorStop(0,startcol || "red");
			grd.addColorStop(1,stopcol || "rgba(255,255,255,0)");
			context.fillStyle=grd;
			context.fillRect(0,0,canvas.width, canvas.height);
		},
		"mag" : function() {
			return Math.sqrt(this.x*this.x + this.y*this.y);
		},
		"add" : function(a) {
			return Point(this.x+a.x, this.y+a.y);
		},
		"scale": function(a) {
			return Point(this.x*a, this.y*a);
		},
		"map" : function(func) {
			return Point(func(this.x), func(this.y));
		},
		"copy" : function() {
			return Point(this.x, this.y, this.group, this.colour);
		},
		"dist_from" : function(point) {
			return Math.sqrt( (this.x-point.x)*(this.x-point.x) + (this.y-point.y)*(this.y-point.y) );
		}

	};
};

var draw = function() {
	context.clearRect(0,0,canvas.width,canvas.height);

	centre = centre_of(points);
	centre.colour = "#000000";
	var centres = _.map(_.groupBy(points, 'group'), centre_of);
	_.map(centres, function(centre) {
		centre.draw_halo(centre.std_dev.mag(),group_colours[centre.group]);
		centre.draw();
	})
	//centre.draw_halo(centre.std_dev.mag(),"rgba(0,0,0,0.5)");
	//centre.draw();
	for(var i=0; i < points.length;  i++) {
		points[i].draw();
	}


};

var random_partition = function(k, points) {
	//randomly shuffle the array then simply assign each point to a group round-robbin style using %
	return _.map(_.shuffle(points), function(point, index) {point.group = index % k; return point});
};

var centre_of = function(some_points) {
	var sum = _.reduce(some_points, function(a,b) {
													return a.add(b);
													},
													Point(0,0)
													);
	var sum_squares = _.reduce(some_points, function(a,b) {
													return a.add(Point(b.x*b.x,b.y*b.y));
													},
													Point(0,0)
													);

	var avg_square = sum_squares.scale(1/some_points.length);
	var centre = sum.scale(1/some_points.length);
	var negative_center_squared = centre.map(function(a) {return a*a}).scale(-1)
	var variance = avg_square.add(negative_center_squared);
	var std_deviation = variance.map(Math.sqrt);
	centre.std_dev = std_deviation;
	centre.group = some_points[0].group;
	return centre;
};


var regroup_points = function(points) {
		var groups = _.groupBy(points, 'group');
		var centres = _.map(groups, centre_of);
		var r = Parallel.mapreduce(centre_of, )
		var new_points = [];
		for (var i = points.length - 1; i >= 0; i--) {
			var new_point = points[i].copy();
			var closest_centre = _.min(centres, function(centre) {return new_point.dist_from(centre);});
			new_point.group = closest_centre.group;
			new_points.push(new_point);
		};
		return new_points;
}

window.onload = setup;

window.onresize = function() {
	canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw();
}
