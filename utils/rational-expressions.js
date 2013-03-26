$.extend(KhanUtil, {

	getExpressionRegex: function(coefficient, vari, constant) {
        // Capture Ax + B or B + Ax, either A or B can be 0
        
        if (coefficient === 0) {
            var regex = "^\\s*";
            regex += constant < 0 ? "[-\\u2212]\\s*" + (-constant) + "\\s*$" : constant + "\\s*$";
            return regex;
        }

        var regex = "^\\s*";
        if (coefficient < 0) {
            regex += "[-\\u2212]\\s*";
        }
        if (coefficient !== 1 && coefficient !== -1) {
            regex += Math.abs(coefficient) + "\\s*";
        }
        regex += vari + "\\s*"

        if (constant === 0) {
            regex += "$";
        } else {
            regex = "(" + regex;
            regex += constant < 0 ? "[-\\u2212]" : "\\+";
            regex += "\\s*" + Math.abs(constant) + "\\s*$)|(^\\s*"
            if (constant < 0) {
                regex += "[-\\u2212]\\s*";
            }
            regex += Math.abs(constant) + "\\s*"
            regex += coefficient < 0 ? "[-\\u2212]\\s*" : "\\+\\s*";
            if (coefficient !== 1 && coefficient !== -1) {
                regex += Math.abs(coefficient) + "\\s*";
            }
            regex += vari + "\\s*$)";
        }

        return regex;
	},

    /*
    Term in an expression
    Takes an array. The first value is the coefficient
    and subsequent values are variables and their degree
    e.g. Term(5) = 5
         Term(5, {'x': 1}) = 5x
         Term(5, {'x': 1, 'y': 2}) = 5xy^2 
    */
    Term: function(coefficient, variables) {
        this.coefficient = coefficient;
        this.variables = {}

        if (typeof variables === 'string') {
            this.variables[variables] = 1;
        } else if (variables !== undefined){
            this.variables = variables;
        }
        
        // Use for hashing
        this.variableString = ''
        for (var vari in this.variables) {
            this.variableString += vari + this.variables[vari];
        }
        
        // Return a new term with the coefficients multiplied
        this.multiply = function(term) {
            var coefficient = this.coefficient;
            var variables = {}

            for (var i in this.variables) {
                variables[i] = this.variables[i];
            }

            if (typeof term === 'number') {
                coefficient *= term;
            } else {
                coefficient *= term.coefficient;
                for (var i in term.variables) {
                    if (variables[i]) {
                        variables[i] += term.variables[i];
                    } else {
                        variables[i] = term.variables[i];
                    }
                }
            }

            return new KhanUtil.Term(coefficient, variables);
        };
        
        this.findGCD = function() {
        };
        
        // includeSign if term is not the first in an expression
        this.toString = function(includeSign) {
            if (this.coefficient === 0) {
                return "";
            }

            var coefficient = this.coefficient;
            var s = "";

            if (includeSign) {
                if (this.coefficient > 0) {
                    s += " + ";
                } else {
                    s += " - ";
                    coefficient *= -1;
                }
            }

            if (coefficient !== 1 || this.variableString === "1") {
                s += coefficient;
            }

            for (var vari in this.variables) {
                var degree = this.variables[vari];

                if (degree === 0) {
                    continue;
                }
                s += vari;
                if (degree > 1) {
                    s += "^" + degree;
                }
            }
            return s
        };
        
    },

    /*
        A flat (i.e. no parentheses), multi-variable polynomial expression
        Represented as an array of terms that are added together
        Terms can be numbers, of [variable, degree]
        e.g. [5, [1, 'x']] = 5 + x
        e.g. [5, [2, {'x': 2}]] = 5 + 2x^2
        e.g. [5, [2, {'x': 2, 'y' : 1]] = 5 + 2x^2y
    */
    RationalExpression: function(terms) {
        this.terms = [];
        
        for (var i = 0; i < terms.length; i++) {
            var term = terms[i];
            if (term instanceof KhanUtil.Term) {
                this.terms.push(term);
            } else if (typeof term === 'number') {
                this.terms.push(new KhanUtil.Term(term));
            } else {
                this.terms.push(new KhanUtil.Term(term[0], term[1]));
            }
        }

        // Combine any terms that have the same variable
        this.combineLikeTerms = function() {
            var variables = {};
            
            for (var i = 0; i < this.terms.length; i++) {
                var term = this.terms[i];
                var s = term.variableString;
            
                if (variables[s]) {
                    variables[s].coefficient += term.coefficient;
                } else {
                    variables[s] = term;
                }
            }
            
            this.terms = [];
            for (var v in variables) {
                this.terms.push(variables[v]);
            }
        };
        
        // Return a new expression which is the sum of this one and the one passed in
        this.add = function(expression) {
            var terms = [];
            
            for (var i = 0; i < this.terms.length; i++) {
                var term = this.terms[i];
                terms.push([term.coefficient, term.variables]);
            }
            
            for (var i = 0; i < expression.terms.length; i++) {
                var term = expression.terms[i];
                terms.push([term.coefficient, term.variables]);
            }
            
            var result = new KhanUtil.RationalExpression(terms);
            result.combineLikeTerms();
            
            return result;
        };
        
        // Return a new expression which is the product of this one and the one passed in
        this.multiply = function(expression) {
            if (expression instanceof RationalExpression) {
                var multiply_terms = expression.terms;
            } else {
                var multiply_terms = [expression];
            }
            
            var terms = [];
            
            for (var i = 0; i < multiply_terms.length; i++) {
                var value = multiply_terms[i];
                
                for (var j = 0; j < this.terms.length; j++) {
                    terms.push(this.terms[j].multiply(value));
                }
            }

            return new KhanUtil.RationalExpression(terms);
        };

        this.toString = function() {
            var s = this.terms[0].toString();

            for (var i = 1; i < this.terms.length; i++) {
                s += this.terms[i].toString(true)
            }
            return s;
        };
    }

});