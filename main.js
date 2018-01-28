var esprima = require("esprima");
var options = {tokens:true, tolerant: true, loc: true, range: true };
var faker = require("faker");
var fs = require("fs");
faker.locale = "en";
var mock = require('mock-fs');
var _ = require('underscore');
var Random = require('random-js');

var phInp=0;
var phOpt=0;

function main()
{
	var args = process.argv.slice(2);

	if( args.length == 0 )
	{
		args = ["subject.js"];
	}
	var filePath = args[0];

	constraints(filePath);

	generateTestCases(filePath)

}

var engine = Random.engines.mt19937().autoSeed();

function createConcreteIntegerValue( greaterThan, constraintValue )
{
	if( greaterThan )
		return Random.integer(constraintValue,constraintValue+10)(engine);
	else
		return Random.integer(constraintValue-10,constraintValue)(engine);
}

function Constraint(properties)
{
	this.ident = properties.ident;
	this.expression = properties.expression;
	this.operator = properties.operator;
	this.value = properties.value;
	this.altvalue = properties.altvalue;
	this.funcName = properties.funcName;
	// Supported kinds: "fileWithContent","fileExists"
	// integer, string, phoneNumber
	this.kind = properties.kind;
}

function fakeDemo()
{
	console.log( faker.phone.phoneNumber() );
	console.log( faker.phone.phoneNumberFormat() );
	console.log( faker.phone.phoneFormats() );
}

var functionConstraints =
{
}

var mockFileLibrary = 
{
	pathExists:
	{
		'path/fileExists': {}
	},
	fileWithContent:
	{
		pathContent: 
		{	
  			file1: 'text content',
		}
	},
	fileWithoutContent:
	{
		pathContent: 
		{	
  			file1: '',
		}
	},
        fileNotExists:
	{
		pathContent: 
		{	
  			file2: '',
		}
	}
};

function permutations(list) {
    return _.reduce(list, function(a, b) {
        return _.flatten(_.map(a, function(x) {
            return _.map(b, function(y) {
                return x.concat([y]);
            });
        }), true);
    }, [ [] ]);
};


function initalizeParams(constraints)
{
	var params = {};
	
	// initialize params
	for (var i =0; i < constraints.params.length; i++ )
	{
		var paramName = constraints.params[i];
		params[paramName] = ['\'\''];
		//params[paramName] = '\'\'';
                if(paramName=="phoneNumber"){
                         phInp=1;
                }
                if(paramName=="options"){
                         phOpt=1;
                }
	}
	return params;	
}

function fillParams(constraints,params,property)
{
	// plug-in values for parameters
	for( var c = 0; c < constraints.length; c++ )
	{
		var constraint = constraints[c];
		if( params.hasOwnProperty( constraint.ident ) )
		{
				//params[constraint.ident] = constraint[property];
				params[constraint.ident].push(constraint.property);
		}
	}
}

function generateTestCases(filePath)
{

//	var content = "var subject = require('./subject.js')\nvar mock = require('mock-fs');\n";
//	var content = "var subject = require('./mystery.js')\nvar mock = require('mock-fs');\n";
	var content = "var subject = require('./" + filePath + "')\nvar mock = require('mock-fs');\n";

	for ( var funcName in functionConstraints )
	{
		var params = initalizeParams(functionConstraints[funcName])
		var altparams = initalizeParams(functionConstraints[funcName])
		
		//console.log( params );

		// update parameter values based on known constraints.
		var constraints = functionConstraints[funcName].constraints;
		// Handle global constraints...
		var fileWithContent = _.some(constraints, {kind: 'fileWithContent' });
		var pathExists      = _.some(constraints, {kind: 'fileExists' });
		var fileWithoutContent = _.some(constraints, {kind: 'fileWithoutContent' });
		var fileNotExists      = _.some(constraints, {kind: 'fileNotExists' });

		for( var c = 0; c < constraints.length; c++ )
		{
			var constraint = constraints[c];
			if( params.hasOwnProperty( constraint.ident ) )
			{
				if((constraint.ident == "dir" && constraint.kind == "fileExists")||
					(constraint.ident == "filePath" && constraint.kind == "fileWithContent")||
					(constraint.ident != "dir" && constraint.ident != "filePath"))
				{
					params[constraint.ident].push(constraint.value);
				}
			}
		}

                for( var c = 0; c < constraints.length; c++ )
                {
                        var constraint = constraints[c];
                        if( params.hasOwnProperty( constraint.ident ) )
                        {
                                if((constraint.ident == "dir" && constraint.kind == "fileExists")||
                                        (constraint.ident == "filePath" && constraint.kind == "fileWithContent")||
                                        (constraint.ident != "dir" && constraint.ident != "filePath"))
                                {       
                                        altparams[constraint.ident].push(constraint.altvalue);
                                }
                        }
                }

//		fillParams(constraints,params,"value")
//		fillParams(constraints,altparams,"altvalue")
		
		var list = Object.keys(params).map( function(x) { return params[x] } );
		permutation = permutations(list);
		for (var i=0; i< permutation.length; i++) {
			content += "subject.{0}({1});\n".format(funcName, permutation[i] );
		
			if( pathExists || fileWithContent || fileWithoutContent )
			{

				var arg = permutation[i].join(',')
				if (arg != "'',''")
				{
					// console.log(argument)
//					content += generateMockFsTestCases(pathExists,fileWithContent,funcName, arg);
//					// Bonus...generate constraint variations test cases....
//					content += generateMockFsTestCases(!pathExists,fileWithContent,funcName, arg);
//					content += generateMockFsTestCases(pathExists,!fileWithContent,funcName, arg);
//					content += generateMockFsTestCases(!pathExists,!fileWithContent,funcName, arg);

					content += generateMockFsTestCases(pathExists,fileWithContent,!fileWithoutContent,!fileNotExists, funcName, arg);
					content += generateMockFsTestCases(pathExists,!fileWithContent,fileWithoutContent,!fileNotExists, funcName, arg);
					content += generateMockFsTestCases(pathExists,!fileWithContent,!fileWithoutContent,!fileNotExists, funcName, arg);
					content += generateMockFsTestCases(pathExists,fileWithContent,!fileWithoutContent,fileNotExists, funcName, arg);

					content += generateMockFsTestCases(!pathExists,!fileWithContent,!fileWithoutContent,!fileNotExists, funcName, arg);
					content += generateMockFsTestCases(!pathExists,fileWithContent,!fileWithoutContent,!fileNotExists, funcName, arg);
					content += generateMockFsTestCases(!pathExists,!fileWithContent,fileWithoutContent,!fileNotExists, funcName, arg);
					content += generateMockFsTestCases(!pathExists,!fileWithContent,!fileWithoutContent, fileNotExists, funcName, arg);
					content += generateMockFsTestCases(pathExists,!fileWithContent,!fileWithoutContent,!fileNotExists, funcName, arg);
				}
			}

		}

		if(phInp==1){
			var temp=[0,1,2,3,4,5,6,7,8,9];
			var phdig=[temp,temp,temp];
			num_of_perm = permutations(phdig)
			for (var i=0; i< num_of_perm.length; i++) {
				var phoneNumberSet = "'" + num_of_perm[i].toString().split(',').join('') + "0000000'";
				params["phoneNumber"] = phoneNumberSet
				if(options)
				{
					params["options"] = "'test'"
				}

				var args = Object.keys(params).map( function(x) {return params[x]; }).join(",");
				var altargs = Object.keys(altparams).map( function(x) {return altparams[x]; }).join(",");
				content += "subject.{0}({1});\n".format(funcName, args );
				content += "subject.{0}({1});\n".format(funcName, altargs );
			}
		}

	}

	fs.writeFileSync('test.js', content, "utf8");
}


function generateMockFsTestCases (pathExists,fileWithContent,fileWithoutContent,fileNotExists,funcName,args) 
{
	var testCase = "";
	// Build mock file system based on constraints.
	var mergedFS = {};
	if( pathExists )
	{
		for (var attrname in mockFileLibrary.pathExists) { mergedFS[attrname] = mockFileLibrary.pathExists[attrname]; }
	if( fileWithContent )
	{
		for (var attrname in mockFileLibrary.fileWithContent) { mergedFS[attrname] = mockFileLibrary.fileWithContent[attrname]; }
	}
	if( fileWithoutContent )
	{
		for (var attrname in mockFileLibrary.fileWithoutContent) { mergedFS[attrname] = mockFileLibrary.fileWithoutContent[attrname]; }
	}
	if( fileNotExists )
	{
		for (var attrname in mockFileLibrary.fileNotExists) { mergedFS[attrname] = mockFileLibrary.fileNotExists[attrname]; }
	}
	}

	testCase += 
	"mock(" +
		JSON.stringify(mergedFS)
		+
	");\n";

	testCase += "\tsubject.{0}({1});\n".format(funcName, args );
	testCase+="mock.restore();\n";
	return testCase;
}

function constraints(filePath)
{
   var buf = fs.readFileSync(filePath, "utf8");
	var result = esprima.parse(buf, options);

	traverse(result, function (node) 
	{
		if (node.type === 'FunctionDeclaration') 
		{
			var funcName = functionName(node);
			console.log("Line : {0} Function: {1}".format(node.loc.start.line, funcName ));

			var params = node.params.map(function(p) {return p.name});

			functionConstraints[funcName] = {constraints:[], params: params};

			// Check for expressions using argument.
			traverse(node, function(child)
			{
				if( child.type === 'BinaryExpression' && child.operator == "==")
				{
					if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
						// get expression from original source code:
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])

						functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: child.left.name,
								value: rightHand,
								altvalue: rightHand+1,
								funcName: funcName,
								kind: "integer",
								operator : child.operator,
								expression: expression
							}));
						if(isNaN(parseInt(rightHand)))
						{
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: child.left.name,
								value: '\'ab101\'',
								altvalue: rightHand,
								funcName: funcName,
								kind: "string",
								operator : child.operator,
								expression: expression
							}));
						}
						else
						{
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: child.left.name,
								value: rightHand+1,
								altvalue: rightHand,
								funcName: funcName,
								kind: "integer",
								operator : child.operator,
								expression: expression
							}));
						}

					}
				}

                                if( child.type === 'BinaryExpression' && child.operator == "!=")
                                {       
                                        if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
                                        {       
                                                // get expression from original source code:
                                                var expression = buf.substring(child.range[0], child.range[1]);
                                                var rightHand = buf.substring(child.right.range[0], child.right.range[1])
                                                
                                                functionConstraints[funcName].constraints.push(
                                                        new Constraint(
                                                        {       
                                                                ident: child.left.name,
                                                                value: rightHand,
//                                                              altvalue: !rightHand,
								altvalue: rightHand+1,
                                                                funcName: funcName,
                                                                kind: "integer",
                                                                operator : child.operator,
                                                                expression: expression
                                                        }));

                                                if(isNaN(parseInt(rightHand)))
                                                {       
                                                        functionConstraints[funcName].constraints.push(
                                                        new Constraint(
                                                        {       
                                                                ident: child.left.name,
                                                                value: '\'ab101\'',
								altvalue: rightHand,
                                                                funcName: funcName,
                                                                kind: "string",
                                                                operator : child.operator,
                                                                expression: expression
                                                        }));
                                                }
                                                else    
                                                {       
                                                        functionConstraints[funcName].constraints.push(
                                                        new Constraint(
                                                        {       
                                                                ident: child.left.name,
                                                                value: rightHand+1,
								altvalue: rightHand,
                                                                funcName: funcName,
                                                                kind: "integer",
                                                                operator : child.operator,
                                                                expression: expression
                                                        }));
                                                }

                                        }
                                }

				if( child.type === 'BinaryExpression' && child.operator == "<" )
				{
					if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
						// get expression from original source code:
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])

						functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: child.left.name,
								value: parseInt(rightHand) - 1,
								altvalue: parseInt(rightHand) +1,
								funcName: funcName,
								kind: "integer",
								operator : child.operator,
								expression: expression
							}));

						functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: child.left.name,
								value: parseInt(rightHand) + 1,
								altvalue: parseInt(rightHand) - 1,
								funcName: funcName,
								kind: "integer",
								operator : child.operator,
								expression: expression
							}));
					}
				}

                                if( child.type === 'BinaryExpression' && child.operator == ">" )
                                {
                                        if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
                                        {
                                                // get expression from original source code:
                                                var expression = buf.substring(child.range[0], child.range[1]);
                                                var rightHand = buf.substring(child.right.range[0], child.right.range[1])

                                                functionConstraints[funcName].constraints.push(
                                                        new Constraint(
                                                        {
                                                                ident: child.left.name,
                                                                value: parseInt(rightHand) + 1,
                                                                altvalue: parseInt(rightHand) - 1,
                                                                funcName: funcName,
                                                                kind: "integer",
                                                                operator : child.operator,
                                                                expression: expression
                                                        }));

                                                functionConstraints[funcName].constraints.push(
                                                        new Constraint(
                                                        {
                                                                ident: child.left.name,
                                                                value: parseInt(rightHand) - 1,
                                                                altvalue: parseInt(rightHand) +1,
                                                                funcName: funcName,
                                                                kind: "integer",
                                                                operator : child.operator,
                                                                expression: expression
                                                        }));
                                        }
                                }

                                if( child.type === 'BinaryExpression' && child.operator == "<=" )
                                {
                                        if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
                                        {
                                                // get expression from original source code:
                                                var expression = buf.substring(child.range[0], child.range[1]);
                                                var rightHand = buf.substring(child.right.range[0], child.right.range[1])

                                                functionConstraints[funcName].constraints.push(
                                                        new Constraint(
                                                        {
                                                                ident: child.left.name,
                                                                value: parseInt(rightHand) - 1,
                                                                altvalue: parseInt(rightHand)+1,
                                                                funcName: funcName,
                                                                kind: "integer",
                                                                operator : child.operator,
                                                                expression: expression
                                                        }));

                                                functionConstraints[funcName].constraints.push(
                                                        new Constraint(
                                                        {
                                                                ident: child.left.name,
                                                                value: parseInt(rightHand),
                                                                altvalue: parseInt(rightHand)+ 1,
                                                                funcName: funcName,
                                                                kind: "integer",
                                                                operator : child.operator,
                                                                expression: expression
                                                        }));
                                                functionConstraints[funcName].constraints.push(
                                                        new Constraint(
                                                        {       
                                                                ident: child.left.name,
                                                                value: parseInt(rightHand) + 1,
                                                                altvalue: parseInt(rightHand) - 1,
                                                                funcName: funcName,
                                                                kind: "integer",
                                                                operator : child.operator,
                                                                expression: expression
                                                        }));

                                        }
                                }

                                if( child.type === 'BinaryExpression' && child.operator == ">=" )
                                {
                                        if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
                                        {
                                                // get expression from original source code:
                                                var expression = buf.substring(child.range[0], child.range[1]);
                                                var rightHand = buf.substring(child.right.range[0], child.right.range[1])
                                                        
                                                functionConstraints[funcName].constraints.push(
                                                        new Constraint(
                                                        {
                                                                ident: child.left.name,
                                                                value: parseInt(rightHand) + 1,
                                                                altvalue: parseInt(rightHand) - 1,
                                                                funcName: funcName,
                                                                kind: "integer",
                                                                operator : child.operator,
                                                                expression: expression
                                                        }));

                                                functionConstraints[funcName].constraints.push(
                                                        new Constraint(
                                                        {
                                                                ident: child.left.name,
                                                                value: parseInt(rightHand),
                                                                altvalue: parseInt(rightHand) - 1,
                                                                funcName: funcName,
                                                                kind: "integer",
                                                                operator : child.operator,
                                                                expression: expression
                                                        }));
                                                functionConstraints[funcName].constraints.push(
                                                        new Constraint(
                                                        {       
                                                                ident: child.left.name,
                                                                value: parseInt(rightHand) - 1,
                                                                altvalue: parseInt(rightHand) + 1,
                                                                funcName: funcName,
                                                                kind: "integer",
                                                                operator : child.operator,
                                                                expression: expression
                                                        }));

                                        }
                                }



				if( child.type == "CallExpression" && child.callee.property &&
					 child.callee.property.name =="indexOf" )
				{	var val = '"' + String(child.arguments[0].value) + '"';
					for( var p =0; p < params.length; p++ )
					{
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: child.callee.object.name,
								value:  val,
                                                                altvalue: '\'ab101\'',
								funcName: funcName,
								kind: "string",
								operator : child.operator,
								expression: expression
							}));
						
					}
				}


				if( child.type == "CallExpression" && 
					 child.callee.property &&
					 child.callee.property.name =="readFileSync" )
				{
					for( var p =0; p < params.length; p++ )
					{
						if( child.arguments[0].name == params[p] )
						{
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[p],
								value:  "'pathContent/file1'",
								funcName: funcName,
								kind: "fileWithContent",
								operator : child.operator,
								expression: expression
							}));
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[p],
								value:  "'pathContent/file2'",
								funcName: funcName,
								kind: "fileWithoutContent",
								operator : child.operator,
								expression: expression
							}));
						}
					}
				}

				if( child.type == "CallExpression" &&
					 child.callee.property &&
					 child.callee.property.name =="existsSync")
				{
					for( var p =0; p < params.length; p++ )
					{
						if( child.arguments[0].name == params[p] )
						{
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[p],
								value:  "'path/fileExists'",
								funcName: funcName,
								kind: "fileExists",
								operator : child.operator,
								expression: expression
							}));
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[p],
								value:  "'path/NoFile'",
								funcName: funcName,
								kind: "fileNotExists",
								operator : child.operator,
								expression: expression
							}));
						}
					}
				}



				if(child.type == "UnaryExpression"  && child.argument && 
					child.argument.property && child.argument.property.type == "Identifier") 
				{
					propertyName = child.argument.property.name;
					var nullOptions = {};
					var normOptions = {};
					normOptions[propertyName] = true;
					var normOptionsFalse = {};
					normOptionsFalse[propertyName] = false;
                                        functionConstraints[funcName].constraints.push(
                                        new Constraint(
                                        {
                                                ident: child.argument.object.name,
                                                value:  JSON.stringify(nullOptions),
                                                altvalue:  JSON.stringify(normOptions),
                                                funcName: funcName,
                                                kind: "Identifier",
                                                operator : child.operator,
                                                expression: expression
                                        }));
                                        functionConstraints[funcName].constraints.push(
                                        new Constraint(
                                        {
                                                ident: child.argument.object.name,
                                                value:  JSON.stringify(normOptionsFalse),
                                                altvalue:  JSON.stringify(normOptions),
                                                funcName: funcName,
                                                kind: "Identifier",
                                                operator : child.operator,
                                                expression: expression
                                        }));
                                        functionConstraints[funcName].constraints.push(
                                        new Constraint(
                                        {
                                                ident: child.argument.object.name,
                                                value:  JSON.stringify(normOptions),
                                                altvalue:  JSON.stringify(normOptionsFalse),
                                                funcName: funcName,
                                                kind: "Identifier",
                                                operator : child.operator,
                                                expression: expression
                                        }));


				}




			});

			console.log( functionConstraints[funcName]);

		}
	});
}

function traverse(object, visitor) 
{
    var key, child;

    visitor.call(null, object);
    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null) {
                traverse(child, visitor);
            }
        }
    }
}

function traverseWithCancel(object, visitor)
{
    var key, child;

    if( visitor.call(null, object) )
    {
	    for (key in object) {
	        if (object.hasOwnProperty(key)) {
	            child = object[key];
	            if (typeof child === 'object' && child !== null) {
	                traverseWithCancel(child, visitor);
	            }
	        }
	    }
 	 }
}

function functionName( node )
{
	if( node.id )
	{
		return node.id.name;
	}
	return "";
}


if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

main();
exports.main = main;
