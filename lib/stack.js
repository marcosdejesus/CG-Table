function Stack(mat4)
{
	this.matrix = [mat4.create()];
	
	this.reset = function() {
		this.matrix = [mat4.create()];
	};
	
	this.top = function() {
		return this.matrix[this.matrix.length - 1];
	};
	
	this.push = function() {
		this.matrix.push(this.top().slice());
		return this.top();
	};
	
	this.pop = function() {
		if ( this.matrix.length > 0 )
			this.matrix.pop();
		return this.top();
	}
};
