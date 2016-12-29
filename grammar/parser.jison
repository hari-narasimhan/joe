
%start Program /* Define Start Production */
%% /* Define Grammar Productions */

Statement
    : Block
    | ExpressionStatement
    | IfStatement
    ;

Block
    : "{" StatementList "}"
        {
            $$ = new BlockStatementNode($2, createSourceLocation(null, @1, @3));
        }
    ;

StatementList
    : StatementList Statement
        {
            $$ = $1.concat($2);
        }
    |
        {
            $$ = [];
        }
    ;

ExpressionStatement
    : ExpressionNoBF ";"
        {
            $$ = new ExpressionStatementNode($1, createSourceLocation(null, @1, @2));
        }
    | ExpressionNoBF error
        {
            $$ = new ExpressionStatementNode($1, createSourceLocation(null, @1, @1));
        }
    ;

IfStatement
    : "IF" "(" Expression ")" Statement
        {
            $$ = new IfStatementNode($3, $5, null, createSourceLocation(null, @1, @5));
        }
    | "IF" "(" Expression ")" Statement "ELSE" Statement
        {
            $$ = new IfStatementNode($3, $5, $7, createSourceLocation(null, @1, @7));
        }
    ;
/*
SwitchStatement
    : "SWITCH" "(" Expression ")" CaseBlock
        {
            $$ = new SwitchStatementNode($3, $5, createSourceLocation(null, @1, @5));
        }
    ;

CaseBlock
    : "{" CaseClauses "}"
        {
            $$ = $2;
        }
    | "{" CaseClauses DefaultClause CaseClauses "}"
        {
            $$ = $2.concat($3).concat($4);
        }
    ;

CaseClauses
    : CaseClauses CaseClause
        {
            $$ = $1.concat($2);
        }
    |
        {
            $$ = [];
        }
    ;

CaseClause
    : "CASE" Expression ":" StatementList
        {
            $$ = new SwitchCaseNode($2, $4, createSourceLocation(null, @1, @4));
        }
    ;

DefaultClause
    : "DEFAULT" ":" StatementList
        {
            $$ = new SwitchCaseNode(null, $3, createSourceLocation(null, @1, @3));
        }
    ;
*/

Program
    : SourceElements EOF
        {
            $$ = new ProgramNode($1, createSourceLocation(null, @1, @2));
            return $$;
        }
    ;

SourceElements
    : SourceElements SourceElement
        {
            $$ = $1.concat($2);
        }
    |
        {
            $$ = [];
        }
    ;

SourceElement
    : Statement
    ;

PrimaryExpression
    : PrimaryExpressionNoBrace
    | ObjectLiteral
    ;

PrimaryExpressionNoBrace
    : "IDENTIFIER"
        {
            $$ = new IdentifierNode($1, createSourceLocation(null, @1, @1));
        }
    | Literal
    | ArrayLiteral
    | "(" Expression ")"
        {
            $$ = $2;
        }
    ;

ArrayLiteral
    : "[" "]"
        {
            $$ = new ArrayExpressionNode([], createSourceLocation(null, @1, @2));
        }
    | "[" Elision "]"
        {
            $$ = new ArrayExpressionNode($2, createSourceLocation(null, @1, @3));
        }
    | "[" ElementList "]"
        {
            $$ = new ArrayExpressionNode($2, createSourceLocation(null, @1, @3));
        }
    | "[" ElementList "," "]"
        {
            $$ = new ArrayExpressionNode($2.concat(null), createSourceLocation(null, @1, @4));
        }
    | "[" ElementList "," Elision "]"
        {
            $$ = new ArrayExpressionNode($2.concat($4), createSourceLocation(null, @1, @5));
        }
    ;

ElementList
    : AssignmentExpression
        {
            $$ = [$1];
        }
    | Elision AssignmentExpression
        {
            $$ = $1.concat($2);
        }
    | ElementList "," AssignmentExpression
        {
            $$ = $1.concat($3);
        }
    | ElementList "," Elision AssignmentExpression
        {
            $$ = $1.concat($3).concat($4);
        }
    ;

Elision
    : ","
        {
            $$ = [null, null];
        }
    | Elision ","
        {
            $$ = $1.concat(null);
        }
    ;

ObjectLiteral
    : "{" "}"
        {
            $$ = new ObjectExpressionNode([], createSourceLocation(null, @1, @2));
        }
    | "{" PropertyNameAndValueList "}"
        {
            $$ = new ObjectExpressionNode($2, createSourceLocation(null, @1, @3));
        }
    | "{" PropertyNameAndValueList "," "}"
        {
            $$ = new ObjectExpressionNode($2, createSourceLocation(null, @1, @4));
        }
    ;

PropertyNameAndValueList
    : PropertyAssignment
        {
            $$ = [$1];
        }
    | PropertyNameAndValueList "," PropertyAssignment
        {
            $$ = $1.concat($3);
        }
    ;

PropertyAssignment
    : PropertyName ":" AssignmentExpression
        {
            $$ = {key: $1, value: $3, kind: "init"};
        }
    | "IDENTIFIER" PropertyName "(" ")" "{" FunctionBody "}"
        {
            if ($1 === "get") {
                $$ = {key: $2, value: (new FunctionExpressionNode(null, [], $6, false, false, createSourceLocation(null, @2, @7))), kind: "get"};
            } else {
                this.parseError("Invalid getter", {});
            }
        }
    | "IDENTIFIER" PropertyName "(" PropertySetParameterList ")" "{" FunctionBody "}"
        {
            if ($1 === "set") {
                $$ = {key: $2, value: (new FunctionExpressionNode(null, $4, $7, false, false, createSourceLocation(null, @2, @8))), kind: "set"};
            } else {
                this.parseError("Invalid setter", {});
            }
        }
    ;

PropertyName
    : IdentifierName
    | StringLiteral
    | NumericLiteral
    ;

PropertySetParameterList
    : "IDENTIFIER"
        {
            $$ = [new IdentifierNode($1, createSourceLocation(null, @1, @1))];
        }
    ;

MemberExpression
    : PrimaryExpression
    | FunctionExpression
    | MemberExpression "[" Expression "]"
        {
            $$ = new MemberExpressionNode($1, $3, true, createSourceLocation(null, @1, @4));
        }
    | MemberExpression "." IdentifierName
        {
            $$ = new MemberExpressionNode($1, $3, false, createSourceLocation(null, @1, @3));
        }

    ;

MemberExpressionNoBF
    : PrimaryExpressionNoBrace
    | MemberExpressionNoBF "[" Expression "]"
        {
            $$ = new MemberExpressionNode($1, $3, true, createSourceLocation(null, @1, @4));
        }
    | MemberExpressionNoBF "." IdentifierName
        {
            $$ = new MemberExpressionNode($1, $3, false, createSourceLocation(null, @1, @3));
        }
    ;

NewExpression
    : MemberExpression
    ;

NewExpressionNoBF
    : MemberExpressionNoBF
    ;

CallExpression
    : MemberExpression Arguments
        {
            $$ = new CallExpressionNode($1, $2, createSourceLocation(null, @1, @2));
        }
    | CallExpression Arguments
        {
            $$ = new CallExpressionNode($1, $2, createSourceLocation(null, @1, @2));
        }
    | CallExpression "[" Expression "]"
        {
            $$ = new MemberExpressionNode($1, $3, true, createSourceLocation(null, @1, @4));
        }
    | CallExpression "." IdentifierName
        {
            $$ = new MemberExpressionNode($1, $3, false, createSourceLocation(null, @1, @3));
        }
    ;

CallExpressionNoBF
    : MemberExpressionNoBF Arguments
        {
            $$ = new CallExpressionNode($1, $2, createSourceLocation(null, @1, @2));
        }
    | CallExpressionNoBF Arguments
        {
            $$ = new CallExpressionNode($1, $2, createSourceLocation(null, @1, @2));
        }
    | CallExpressionNoBF "[" Expression "]"
        {
            $$ = new MemberExpressionNode($1, $3, true, createSourceLocation(null, @1, @4));
        }
    | CallExpressionNoBF "." IdentifierName
        {
            $$ = new MemberExpressionNode($1, $3, false, createSourceLocation(null, @1, @3));
        }
    ;

IdentifierName
    : "IDENTIFIER"
        {
            $$ = new IdentifierNode($1, createSourceLocation(null, @1, @1));
        }
    | ReservedWord
        {
            $$ = new IdentifierNode($1, createSourceLocation(null, @1, @1));
        }
    ;

Arguments
    : "(" ")"
        {
            $$ = [];
        }
    | "(" ArgumentList ")"
        {
            $$ = $2;
        }
    ;

ArgumentList
    : AssignmentExpression
        {
            $$ = [$1];
        }
    | ArgumentList "," AssignmentExpression
        {
            $$ = $1.concat($3);
        }
    ;

LeftHandSideExpression
    : NewExpression
    | CallExpression
    ;

LeftHandSideExpressionNoBF
    : NewExpressionNoBF
    | CallExpressionNoBF
    ;

PostfixExpression
    : LeftHandSideExpression
    ;

PostfixExpressionNoBF
    : LeftHandSideExpressionNoBF
    ;

UnaryExpression
    : PostfixExpression
    | UnaryExpr
    ;

UnaryExpressionNoBF
    : PostfixExpressionNoBF
    | UnaryExpr
    ;

UnaryExpr
    : "+" UnaryExpression
        {
            $$ = new UnaryExpressionNode("+", true, $2, createSourceLocation(null, @1, @2));
        }
    | "-" UnaryExpression
        {
            $$ = new UnaryExpressionNode("-", true, $2, createSourceLocation(null, @1, @2));
        }
    | "!" UnaryExpression
        {
            $$ = new UnaryExpressionNode("!", true, $2, createSourceLocation(null, @1, @2));
        }
    ;

MultiplicativeExpression
    : UnaryExpression
    | MultiplicativeExpression "*" UnaryExpression
        {
            $$ = new BinaryExpressionNode("*", $1, $3, createSourceLocation(null, @1, @3));
        }
    | MultiplicativeExpression "/" UnaryExpression
        {
            $$ = new BinaryExpressionNode("/", $1, $3, createSourceLocation(null, @1, @3));
        }
    | MultiplicativeExpression "%" UnaryExpression
        {
            $$ = new BinaryExpressionNode("%", $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

MultiplicativeExpressionNoBF
    : UnaryExpressionNoBF
    | MultiplicativeExpressionNoBF "*" UnaryExpression
        {
            $$ = new BinaryExpressionNode("*", $1, $3, createSourceLocation(null, @1, @3));
        }
    | MultiplicativeExpressionNoBF "/" UnaryExpression
        {
            $$ = new BinaryExpressionNode("/", $1, $3, createSourceLocation(null, @1, @3));
        }
    | MultiplicativeExpressionNoBF "%" UnaryExpression
        {
            $$ = new BinaryExpressionNode("%", $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

AdditiveExpression
    : MultiplicativeExpression
    | AdditiveExpression "+" MultiplicativeExpression
        {
            $$ = new BinaryExpressionNode("+", $1, $3, createSourceLocation(null, @1, @3));
        }
    | AdditiveExpression "-" MultiplicativeExpression
        {
            $$ = new BinaryExpressionNode("-", $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

AdditiveExpressionNoBF
    : MultiplicativeExpressionNoBF
    | AdditiveExpressionNoBF "+" MultiplicativeExpression
        {
            $$ = new BinaryExpressionNode("+", $1, $3, createSourceLocation(null, @1, @3));
        }
    | AdditiveExpressionNoBF "-" MultiplicativeExpression
        {
            $$ = new BinaryExpressionNode("-", $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

ShiftExpression
    : AdditiveExpression
    | ShiftExpression "<<" AdditiveExpression
        {
            $$ = new BinaryExpressionNode("<<", $1, $3, createSourceLocation(null, @1, @3));
        }
    | ShiftExpression ">>" AdditiveExpression
        {
            $$ = new BinaryExpressionNode(">>", $1, $3, createSourceLocation(null, @1, @3));
        }
    | ShiftExpression ">>>" AdditiveExpression
        {
            $$ = new BinaryExpressionNode(">>>", $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

ShiftExpressionNoBF
    : AdditiveExpressionNoBF
    | ShiftExpressionNoBF "<<" AdditiveExpression
        {
            $$ = new BinaryExpressionNode("<<", $1, $3, createSourceLocation(null, @1, @3));
        }
    | ShiftExpressionNoBF ">>" AdditiveExpression
        {
            $$ = new BinaryExpressionNode(">>", $1, $3, createSourceLocation(null, @1, @3));
        }
    | ShiftExpressionNoBF ">>>" AdditiveExpression
        {
            $$ = new BinaryExpressionNode(">>>", $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

RelationalExpression
    : ShiftExpression
    | RelationalExpression "<" ShiftExpression
        {
            $$ = new BinaryExpressionNode("<", $1, $3, createSourceLocation(null, @1, @3));
        }
    | RelationalExpression ">" ShiftExpression
        {
            $$ = new BinaryExpressionNode(">", $1, $3, createSourceLocation(null, @1, @3));
        }
    | RelationalExpression "<=" ShiftExpression
        {
            $$ = new BinaryExpressionNode("<=", $1, $3, createSourceLocation(null, @1, @3));
        }
    | RelationalExpression ">=" ShiftExpression
        {
            $$ = new BinaryExpressionNode(">=", $1, $3, createSourceLocation(null, @1, @3));
        }
    | RelationalExpression "IN" ShiftExpression
        {
            $$ = new BinaryExpressionNode("in", $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

RelationalExpressionNoIn
    : ShiftExpression
    | RelationalExpressionNoIn "<" ShiftExpression
        {
            $$ = new BinaryExpressionNode("<", $1, $3, createSourceLocation(null, @1, @3));
        }
    | RelationalExpressionNoIn ">" ShiftExpression
        {
            $$ = new BinaryExpressionNode(">", $1, $3, createSourceLocation(null, @1, @3));
        }
    | RelationalExpressionNoIn "<=" ShiftExpression
        {
            $$ = new BinaryExpressionNode("<=", $1, $3, createSourceLocation(null, @1, @3));
        }
    | RelationalExpressionNoIn ">=" ShiftExpression
        {
            $$ = new BinaryExpressionNode(">=", $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

RelationalExpressionNoBF
    : ShiftExpressionNoBF
    | RelationalExpressionNoBF "<" ShiftExpression
        {
            $$ = new BinaryExpressionNode("<", $1, $3, createSourceLocation(null, @1, @3));
        }
    | RelationalExpressionNoBF ">" ShiftExpression
        {
            $$ = new BinaryExpressionNode(">", $1, $3, createSourceLocation(null, @1, @3));
        }
    | RelationalExpressionNoBF "<=" ShiftExpression
        {
            $$ = new BinaryExpressionNode("<=", $1, $3, createSourceLocation(null, @1, @3));
        }
    | RelationalExpressionNoBF ">=" ShiftExpression
        {
            $$ = new BinaryExpressionNode(">=", $1, $3, createSourceLocation(null, @1, @3));
        }
    | RelationalExpressionNoBF "INSTANCEOF" ShiftExpression
        {
            $$ = new BinaryExpressionNode("instanceof", $1, $3, createSourceLocation(null, @1, @3));
        }
    | RelationalExpressionNoBF "IN" ShiftExpression
        {
            $$ = new BinaryExpressionNode("in", $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

EqualityExpression
    : RelationalExpression
    | EqualityExpression "==" RelationalExpression
        {
            $$ = new BinaryExpressionNode("==", $1, $3, createSourceLocation(null, @1, @3));
        }
    | EqualityExpression "!=" RelationalExpression
        {
            $$ = new BinaryExpressionNode("!=", $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

EqualityExpressionNoIn
    : RelationalExpressionNoIn
    | EqualityExpressionNoIn "==" RelationalExpressionNoIn
        {
            $$ = new BinaryExpressionNode("==", $1, $3, createSourceLocation(null, @1, @3));
        }
    | EqualityExpressionNoIn "!=" RelationalExpressionNoIn
        {
            $$ = new BinaryExpressionNode("!=", $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

EqualityExpressionNoBF
    : RelationalExpressionNoBF
    | EqualityExpressionNoBF "==" RelationalExpression
        {
            $$ = new BinaryExpressionNode("==", $1, $3, createSourceLocation(null, @1, @3));
        }
    | EqualityExpressionNoBF "!=" RelationalExpression
        {
            $$ = new BinaryExpressionNode("!=", $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

BitwiseANDExpression
    : EqualityExpression
    | BitwiseANDExpression "&" EqualityExpression
        {
            $$ = new BinaryExpressionNode("&", $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

BitwiseANDExpressionNoIn
    : EqualityExpressionNoIn
    | BitwiseANDExpressionNoIn "&" EqualityExpressionNoIn
        {
            $$ = new BinaryExpressionNode("&", $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

BitwiseANDExpressionNoBF
    : EqualityExpressionNoBF
    | BitwiseANDExpressionNoBF "&" EqualityExpression
        {
            $$ = new BinaryExpressionNode("&", $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

BitwiseXORExpression
    : BitwiseANDExpression
    | BitwiseXORExpression "^" BitwiseANDExpression
        {
            $$ = new BinaryExpressionNode("^", $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

BitwiseXORExpressionNoIn
    : BitwiseANDExpressionNoIn
    | BitwiseXORExpressionNoIn "^" BitwiseANDExpressionNoIn
        {
            $$ = new BinaryExpressionNode("^", $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

BitwiseXORExpressionNoBF
    : BitwiseANDExpressionNoBF
    | BitwiseXORExpressionNoBF "^" BitwiseANDExpression
        {
            $$ = new BinaryExpressionNode("^", $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

BitwiseORExpression
    : BitwiseXORExpression
    | BitwiseORExpression "|" BitwiseXORExpression
        {
            $$ = new BinaryExpressionNode("|", $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

BitwiseORExpressionNoIn
    : BitwiseXORExpressionNoIn
    | BitwiseORExpressionNoIn "|" BitwiseXORExpressionNoIn
        {
            $$ = new BinaryExpressionNode("|", $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

BitwiseORExpressionNoBF
    : BitwiseXORExpressionNoBF
    | BitwiseORExpressionNoBF "|" BitwiseXORExpression
        {
            $$ = new BinaryExpressionNode("|", $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

LogicalANDExpression
    : BitwiseORExpression
    | LogicalANDExpression "&&" BitwiseORExpression
        {
            $$ = new LogicalExpressionNode("&&", $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

LogicalANDExpressionNoIn
    : BitwiseORExpressionNoIn
    | LogicalANDExpressionNoIn "&&" BitwiseORExpressionNoIn
        {
            $$ = new LogicalExpressionNode("&&", $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

LogicalANDExpressionNoBF
    : BitwiseORExpressionNoBF
    | LogicalANDExpressionNoBF "&&" BitwiseORExpression
        {
            $$ = new LogicalExpressionNode("&&", $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

LogicalORExpression
    : LogicalANDExpression
    | LogicalORExpression "||" LogicalANDExpression
        {
            $$ = new LogicalExpressionNode("||", $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

LogicalORExpressionNoIn
    : LogicalANDExpressionNoIn
    | LogicalORExpressionNoIn "||" LogicalANDExpressionNoIn
        {
            $$ = new LogicalExpressionNode("||", $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

LogicalORExpressionNoBF
    : LogicalANDExpressionNoBF
    | LogicalORExpressionNoBF "||" LogicalANDExpression
        {
            $$ = new LogicalExpressionNode("||", $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

ConditionalExpression
    : LogicalORExpression
    | LogicalORExpression "?" AssignmentExpression ":" AssignmentExpression
        {
            $$ = new ConditionalExpressionNode($1, $3, $5, createSourceLocation(null, @1, @5));
        }
    ;

ConditionalExpressionNoIn
    : LogicalORExpressionNoIn
    | LogicalORExpressionNoIn "?" AssignmentExpression ":" AssignmentExpressionNoIn
        {
            $$ = new ConditionalExpressionNode($1, $3, $5, createSourceLocation(null, @1, @5));
        }
    ;

ConditionalExpressionNoBF
    : LogicalORExpressionNoBF
    | LogicalORExpressionNoBF "?" AssignmentExpression ":" AssignmentExpression
        {
            $$ = new ConditionalExpressionNode($1, $3, $5, createSourceLocation(null, @1, @5));
        }
    ;

AssignmentExpression
    : ConditionalExpression
    | LeftHandSideExpression "=" AssignmentExpression
        {
            $$ = new AssignmentExpressionNode("=", $1, $3, createSourceLocation(null, @1, @3));
        }
    | LeftHandSideExpression AssignmentOperator AssignmentExpression
        {
            $$ = new AssignmentExpressionNode($2, $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

AssignmentExpressionNoIn
    : ConditionalExpressionNoIn
    | LeftHandSideExpression "=" AssignmentExpressionNoIn
        {
            $$ = new AssignmentExpressionNode("=", $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

AssignmentExpressionNoBF
    : ConditionalExpressionNoBF
    | LeftHandSideExpressionNoBF "=" AssignmentExpression
        {
            $$ = new AssignmentExpressionNode("=", $1, $3, createSourceLocation(null, @1, @3));
        }
    ;

Expression
    : AssignmentExpression
    | Expression "," AssignmentExpression
        {
            if ($1.type === "SequenceExpression") {
                $1.expressions.concat($3);
                $1.loc = createSourceLocation(null, @1, @3);
                $$ = $1;
            } else {
                $$ = new SequenceExpressionNode([$1, $3], createSourceLocation(null, @1, @3));
            }
        }
    ;

ExpressionNoIn
    : AssignmentExpressionNoIn
    | ExpressionNoIn "," AssignmentExpressionNoIn
        {
            if ($1.type === "SequenceExpression") {
                $1.expressions.concat($3);
                $1.loc = createSourceLocation(null, @1, @3);
                $$ = $1;
            } else {
                $$ = new SequenceExpressionNode([$1, $3], createSourceLocation(null, @1, @3));
            }
        }
    ;

ExpressionNoBF
    : AssignmentExpressionNoBF
    | ExpressionNoBF "," AssignmentExpression
        {
            if ($1.type === "SequenceExpression") {
                $1.expressions.concat($3);
                $1.loc = createSourceLocation(null, @1, @3);
                $$ = $1;
            } else {
                $$ = new SequenceExpressionNode([$1, $3], createSourceLocation(null, @1, @3));
            }
        }
    ;

Literal
    : NullLiteral
    | BooleanLiteral
    | NumericLiteral
    | StringLiteral
    | RegularExpressionLiteral
    ;

NullLiteral
    : "NULL"
        {
            $$ = new LiteralNode(null, createSourceLocation(null, @1, @1));
        }
    ;

BooleanLiteral
    : "TRUE"
        {
            $$ = new LiteralNode(true, createSourceLocation(null, @1, @1));
        }
    | "FALSE"
        {
            $$ = new LiteralNode(false, createSourceLocation(null, @1, @1));
        }
    ;

NumericLiteral
    : "NUMERIC_LITERAL"
        {
            $$ = new LiteralNode(parseNumericLiteral($1), createSourceLocation(null, @1, @1));
        }
    ;

StringLiteral
    : "STRING_LITERAL"
        {
            $$ = new LiteralNode($1, createSourceLocation(null, @1, @1));
        }
    ;

RegularExpressionLiteral
    : RegularExpressionLiteralBegin "REGEXP_LITERAL"
        {
            $$ = new LiteralNode(parseRegularExpressionLiteral($1 + $2), createSourceLocation(null, @1, @2));
        }
    ;

RegularExpressionLiteralBegin
    : "/"
        {
            yy.lexer.begin("REGEXP");
        }
    | "/="
        {
            yy.lexer.begin("REGEXP");
        }
    ;

ReservedWord
    : "BREAK"
    | "CASE"
    | "CATCH"
    | "CONTINUE"
    | "DEBUGGER"
    | "DEFAULT"
    | "DELETE"
    | "DO"
    | "ELSE"
    | "FINALLY"
    | "FOR"
    | "FUNCTION"
    | "IF"
    | "IN"
    | "INSTANCEOF"
    | "NEW"
    | "RETURN"
    | "SWITCH"
    | "THIS"
    | "THROW"
    | "TRY"
    | "TYPEOF"
    | "VAR"
    | "VOID"
    | "WHILE"
    | "WITH"
    | "TRUE"
    | "FALSE"
    | "NULL"
    | "CLASS"
    | "CONST"
    | "ENUM"
    | "EXPORT"
    | "EXTENDS"
    | "IMPORT"
    | "SUPER"
    ;

%%

function createSourceLocation(source, firstToken, lastToken) {
	return new SourceLocation(source, new Position(firstToken.first_line, firstToken.first_column), new Position(lastToken.last_line, lastToken.last_column));
}

function parseRegularExpressionLiteral(literal) {
	var last = literal.lastIndexOf("/");
	var body = literal.substring(1, last);
	var flags = literal.substring(last + 1);

	return new RegExp(body, flags);
}

function parseNumericLiteral(literal) {
  // Check if the literal is a decimal
  if ( literal.indexOf('.') >= 0
      || literal.indexOf('e') >= 0
      || literal.indexOf('E') >= 0) {
        return Number(literal);
  } else if (literal.length > 1 && literal.charAt(0) === "0") {
		if (literal.charAt(1).toLowerCase() === "x") {
			return parseInt(literal, 16);
		} else if (literal.charAt(1).toLowerCase() === "o") {
      return parseInt(literal, 8);
    } else if (literal.charAt(1).toLowerCase() === "b") {
      return parseInt(literal, 2);
    } else {
			return parseInt(literal, 10);
		}
	} else {
    return parseInt(literal, 10)
  }
}

/* Begin Parser Customization Methods */
var _originalParseMethod = parser.parse;

parser.parse = function(source, args) {
	parser.wasNewLine = false;
	parser.newLine = false;
	parser.restricted = false;

	return _originalParseMethod.call(this, source);
};

parser.parseError = function(str, hash) {
//		alert(JSON.stringify(hash) + "\n\n\n" + parser.newLine + "\n" + parser.wasNewLine + "\n\n" + hash.expected.indexOf("';'"));
	if (!((hash.expected && hash.expected.indexOf("';'") >= 0) && (hash.token === "}" || hash.token === "EOF" || hash.token === "BR++" || hash.token === "BR--" || parser.newLine || parser.wasNewLine))) {
		throw new SyntaxError(str);
	}
};
/* End Parser Customization Methods */

/* Begin AST Node Constructors */
function ProgramNode(body, loc) {
	this.type = "Program";
	this.body = body;
	this.loc = loc;
}

function EmptyStatementNode(loc) {
	this.type = "EmptyStatement";
	this.loc = loc;
}

function BlockStatementNode(body, loc) {
	this.type = "BlockStatement";
	this.body = body;
	this.loc = loc;
}

function ExpressionStatementNode(expression, loc) {
	this.type = "ExpressionStatement";
	this.expression = expression;
	this.loc = loc;
}

function IfStatementNode(test, consequent, alternate, loc) {
	this.type = "IfStatement";
	this.test = test;
	this.consequent = consequent;
	this.alternate = alternate;
	this.loc = loc;
}

// function LabeledStatementNode(label, body, loc) {
// 	this.type = "LabeledStatement";
// 	this.label = label;
// 	this.body = body;
// 	this.loc = loc;
// }

// function BreakStatementNode(label, loc) {
// 	this.type = "BreakStatement";
// 	this.label = label;
// 	this.loc = loc;
// }
//
// function ContinueStatementNode(label, loc) {
// 	this.type = "ContinueStatement";
// 	this.label = label;
// 	this.loc = loc;
// }
//
// function WithStatementNode(object, body, loc) {
// 	this.type = "WithStatement";
// 	this.object = object;
// 	this.body = body;
// 	this.loc = loc;
// }

// function SwitchStatementNode(discriminant, cases, loc) {
// 	this.type = "SwitchStatement";
// 	this.discriminant = discriminant;
// 	this.cases = cases;
// 	this.loc = loc;
// }

// function ReturnStatementNode(argument, loc) {
// 	this.type = "ReturnStatement";
// 	this.argument = argument;
// 	this.loc = loc;
// }

// function ThrowStatementNode(argument, loc) {
// 	this.type = "ThrowStatement";
// 	this.argument = argument;
// 	this.loc = loc;
// }

// function TryStatementNode(block, handlers, finalizer, loc) {
// 	this.type = "TryStatement";
// 	this.block = block;
// 	this.handlers = handlers; // Multiple catch clauses are SpiderMonkey specific
// 	this.finalizer = finalizer;
// 	this.loc = loc;
// }
//
// function WhileStatementNode(test, body, loc) {
// 	this.type = "WhileStatement";
// 	this.test = test;
// 	this.body = body;
// 	this.loc = loc;
// }
//
// function DoWhileStatementNode(body, test, loc) {
// 	this.type = "DoWhileStatement";
// 	this.body = body;
// 	this.test = test;
// 	this.loc = loc;
// }
//
// function ForStatementNode(init, test, update, body, loc) {
// 	this.type = "ForStatement";
// 	this.init = init;
// 	this.test = test;
// 	this.update = update;
// 	this.body = body;
// 	this.loc = loc;
// }
//
// function ForInStatementNode(left, right, body, loc) {
// 	this.type = "ForInStatement";
// 	this.left = left;
// 	this.right = right;
// 	this.body = body;
// 	this.loc = loc;
// }

// function DebugggerStatementNode(loc) {
// 	this.type = "DebuggerStatement";
// 	this.loc = loc;
// }

// function FunctionDeclarationNode(id, params, body, generator, expression, loc) {
// 	this.type = "FunctionDeclaration";
// 	this.id = id;
// 	this.params = params;
// 	this.body = body;
// 	this.generator = generator;
// 	this.expression = expression;
// 	this.loc = loc;
// }
//
// function VariableDeclarationNode(declarations, kind, loc) {
// 	this.type = "VariableDeclaration";
// 	this.declarations = declarations;
// 	this.kind = kind;
// 	this.loc = loc;
// }
//
// function VariableDeclaratorNode(id, init, loc) {
// 	this.type = "VariableDeclarator";
// 	this.id = id;
// 	this.init = init;
// 	this.loc = loc;
// }
//
// function ThisExpressionNode(loc) {
// 	this.type = "ThisExpression";
// 	this.loc = loc;
// }

function ArrayExpressionNode(elements, loc) {
	this.type = "ArrayExpression";
	this.elements = elements;
	this.loc = loc;
}

function ObjectExpressionNode(properties, loc) {
	this.type = "ObjectExpression";
	this.properties = properties;
	this.loc = loc;
}

// function FunctionExpressionNode(id, params, body, generator, expression, loc) {
// 	this.type = "FunctionExpression";
// 	this.id = id;
// 	this.params = params;
// 	this.body = body;
// 	this.generator = generator;
// 	this.expression = expression;
// 	this.loc = loc;
// }

function SequenceExpressionNode(expressions, loc) {
	this.type = "SequenceExpression";
	this.expressions = expressions;
	this.loc = loc;
}

function UnaryExpressionNode(operator, prefix, argument, loc) {
	this.type = "UnaryExpression";
	this.operator = operator;
	this.prefix = prefix;
	this.argument = argument;
	this.loc = loc;
}

function BinaryExpressionNode(operator, left, right, loc) {
	this.type = "BinaryExpression";
	this.operator = operator;
	this.left = left;
	this.right = right;
	this.loc = loc;
}

function AssignmentExpressionNode(operator, left, right, loc) {
	this.type = "AssignmentExpression";
	this.operator = operator;
	this.left = left;
	this.right = right;
	this.loc = loc;
}

// function UpdateExpressionNode(operator, argument, prefix, loc) {
// 	this.type = "UpdateExpression";
// 	this.operator = operator;
// 	this.argument = argument;
// 	this.prefix = prefix;
// 	this.loc = loc;
// }

function LogicalExpressionNode(operator, left, right, loc) {
	this.type = "LogicalExpression";
	this.operator = operator;
	this.left = left;
	this.right = right;
	this.loc = loc;
}

function ConditionalExpressionNode(test, consequent, alternate, loc) {
	this.type = "ConditionalExpression";
	this.test = test;
	this.consequent = consequent;
	this.alternate = alternate;
	this.loc = loc;
}

// function NewExpressionNode(callee, args, loc) {
// 	this.type = "NewExpression";
// 	this.callee = callee;
// 	this.arguments = args;
// 	this.loc = loc;
// }
//
function CallExpressionNode(callee, args, loc) {
	this.type = "CallExpression";
	this.callee = callee;
	this.arguments = args;
	this.loc = loc;
}

function MemberExpressionNode(object, property, computed, loc) {
	this.type = "MemberExpression";
	this.object = object;
	this.property = property;
	this.computed = computed;
	this.loc = loc;
}

function SwitchCaseNode(test, consequent, loc) {
	this.type = "SwitchCase";
	this.test = test;
	this.consequent = consequent;
	this.loc = loc;
}

// function CatchClauseNode(param, body, loc) {
// 	this.type = "CatchClause";
// 	this.param = param;
// 	this.guard = null; /* Firefox specific */
// 	this.body = body;
// 	this.loc = loc;
// }

function IdentifierNode(name, loc) {
	this.type = "Identifier";
	this.name = name;
	this.loc = loc;
}

function LiteralNode(value, loc) {
	this.type = "Literal";
	this.value = value;
	this.loc = loc;
}

function SourceLocation(source, start, end) {
	this.source = source;
	this.start = start;
	this.end = end;
}

function Position(line, column) {
	this.line = line;
	this.column = column;
}

/* Object and Array patterns are not part of the ECMAScript Standard
function ObjectPatternNode() {
	this.type = "ObjectPattern";
	this.properties = [];
}

function ArrayPatternNode() {
	this.type = "ArrayPattern";
	this.elements = [];
}
*/
/* End AST Node Constructors */

/* Expose the AST Node Constructors */
parser.ast = {};
parser.ast.ProgramNode = ProgramNode;
parser.ast.EmptyStatementNode = EmptyStatementNode;
parser.ast.BlockStatementNode = BlockStatementNode;
parser.ast.ExpressionStatementNode = ExpressionStatementNode;
parser.ast.IfStatementNode = IfStatementNode;
//parser.ast.LabeledStatementNode = LabeledStatementNode;
//parser.ast.BreakStatementNode = BreakStatementNode;
//parser.ast.ContinueStatementNode = ContinueStatementNode;
//parser.ast.WithStatementNode = WithStatementNode;
// parser.ast.SwitchStatementNode = SwitchStatementNode;
// parser.ast.ReturnStatementNode = ReturnStatementNode;
//parser.ast.ThrowStatementNode = ThrowStatementNode;
//parser.ast.TryStatementNode = TryStatementNode;
//parser.ast.WhileStatementNode = WhileStatementNode;
//parser.ast.DoWhileStatementNode = DoWhileStatementNode;
//parser.ast.ForStatementNode = ForStatementNode;
//parser.ast.ForInStatementNode = ForInStatementNode;
//parser.ast.DebugggerStatementNode = DebugggerStatementNode;
//parser.ast.FunctionDeclarationNode = FunctionDeclarationNode;
//parser.ast.VariableDeclarationNode = VariableDeclarationNode;
//parser.ast.VariableDeclaratorNode = VariableDeclaratorNode;
//parser.ast.ThisExpressionNode = ThisExpressionNode;
parser.ast.ArrayExpressionNode = ArrayExpressionNode;
parser.ast.ObjectExpressionNode = ObjectExpressionNode;
//parser.ast.FunctionExpressionNode = FunctionExpressionNode;
parser.ast.SequenceExpressionNode = SequenceExpressionNode;
parser.ast.UnaryExpressionNode = UnaryExpressionNode;
parser.ast.BinaryExpressionNode = BinaryExpressionNode;
parser.ast.AssignmentExpressionNode = AssignmentExpressionNode;
// parser.ast.UpdateExpressionNode = UpdateExpressionNode;
parser.ast.LogicalExpressionNode = LogicalExpressionNode;
parser.ast.ConditionalExpressionNode = ConditionalExpressionNode;
//parser.ast.NewExpressionNode = NewExpressionNode;
parser.ast.CallExpressionNode = CallExpressionNode;
parser.ast.MemberExpressionNode = MemberExpressionNode;
parser.ast.SwitchCaseNode = SwitchCaseNode;
//parser.ast.CatchClauseNode = CatchClauseNode;
parser.ast.IdentifierNode = IdentifierNode;
parser.ast.LiteralNode = LiteralNode;
