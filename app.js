


// Budget data Controller
var dataController = (function() {

    var Expense = function(id,description,value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    Expense.prototype.calcPercentage = function (totalIncome) {
        if(totalIncome > 0) {
            this.percentage = Math.round((this.value/totalIncome) * 100);
        } else {
            this.percentage = -1;
        }
        
    };

    Expense.prototype.getPercent = function() {
        return this.percentage;
    }
    
    var Income =  function(id,description,value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };

    var calculateTotal = function (type) {
        var sum = 0;

        Database.allItems[type].forEach(function (item) {
            sum += item.value;
        });
        Database.totals[type] = sum;
    };

    var Database = {
        allItems : {
            exp : [],
            inc : []
        },
        totals : {
            exp : 0,
            inc : 0
        },
        budget : 0,
        percentage : -1   
    };

    return {
        addItem : function(type, desc, val) {
            var newItem,ID;
            
            // ID = lastID + 1
            if (Database.allItems[type].length > 0) {
                // console.log('here');
                ID = Database.allItems[type][Database.allItems[type].length - 1].id + 1;
            } else {
                ID = 0;
                // console.log('now hw');
            }
            // Create Item object based on type
            if (type === 'exp') {
                newItem = new Expense(ID, desc, val);
            } else if (type === 'inc') {
                newItem = new Income(ID, desc, val);
            }
            // Push to Database
            Database.allItems[type].push(newItem);
            // Database.totals[type] += parseFloat(val);
            return newItem;
        },
        
        calculateBudget : function() {
            calculateTotal('inc');
            calculateTotal('exp')
            
            Database.budget = Database.totals.inc - Database.totals.exp;
            if (Database.totals.inc > 0) {
                Database.budgetPercent = Math.round((Database.totals.exp / Database.totals.inc) * 100)
            }; 
        },

        calculatePercentage : function() {
            Database.allItems.exp.forEach(function(cur) {
                cur.calcPercentage(Database.totals.inc);
            });
        },

        getPercentage : function() {
            var allPerc = Database.allItems.exp.map(function(cur) {
                return cur.getPercent();
            });
            return allPerc;
        },

        getBudget : function() {
            return  {
                income : Database.totals.inc,
                expenses : Database.totals.exp,
                budget : Database.budget,
                percent : Database.budgetPercent
            }
        },
        testing : function () {
            console.log(Database);  
        },

        deleteItem : function(type, id) {
            var idx, ids;    
            // console.log(Database.allItems[type]);
            ids = Database.allItems[type].map(function(current) {
                return current.id;
            });

            idx = ids.indexOf(id);

            if (idx !== -1) {
                Database.allItems[type].splice(idx, 1);
            }

        }
    };
    
})();


// UI Controller

var UIController = (function() {

    var DOMstrings = {
        inputType : '.add__type',
        inputDescription : '.add__description',
        inputValue : '.add__value',
        inputBtn : '.add__btn',
        incomeContainer : '.income__list',
        expensesContainer : '.expenses__list',
        totalExpense : '.budget__expenses--value',
        Percentage : '.budget__expenses--percentage',
        totalIncome : '.budget__income--value',
        totalBudget : '.budget__value',
        container : '.container',
        expPercentage : 'item__percentage',
        month : '.budget__title--month',
        currentDate : '.current__date',
        inputType : '.add__type'
    };

    var ForEachNode = function(list, callback) {
        for (var i = 0; i < list.length; i++) {
            callback(list[i], i);
        }
    };

    var formatNumber = function(num, type) {
        /***************
         * + or - BEFORE NUMBER
         * Exactly two decimal
         *
         * Comma after 1,000
         */
        var numInt, numSplit, numDec;
        num = Math.abs(num);
        num = num.toFixed(2);

        numSplit = num.split('.');
        numInt = numSplit[0];
        numDec = numSplit[1];
        if (numInt.length >3) {
            numInt = numInt.substr(0, numInt.length-3) + ',' + numInt.substr(numInt.length-3,numInt.length);
        }
        return (type === 'exp' ? '-' : '+') + ' ' + numInt + '.' + numDec;
    };

    // Get Input Data
    return {
        getInput : function () {
            return {
                type : document.querySelector(DOMstrings.inputType).value,
                description : document.querySelector(DOMstrings.inputDescription).value,
                value : parseFloat(document.querySelector(DOMstrings.inputValue).value)
            }
        },
        
        changeType : function() {
            var fields = document.querySelectorAll(DOMstrings.inputType + ',' +
                DOMstrings.inputDescription + ',' + 
                DOMstrings.inputValue);
            
            ForEachNode(fields, function(cur) {
                cur.classList.toggle('red-focus');
            });

            document.querySelector(DOMstrings.inputBtn).classList.toggle('red');
        
        },

        addListItem : function(type,obj) {
            // Create HTML String
            var html, container;

            if (type === 'inc') {
                container = DOMstrings.incomeContainer;
                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%desc%</div><div class="right clearfix"><div class="item__value">%val%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            } else if (type === 'exp') {
                container = DOMstrings.expensesContainer;
                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%desc%</div><div class="right clearfix"><div class="item__value">%val%</div><div class="item__percentage">%percent%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }

            // Replace PlaceHolder Text
            newHtml = html.replace('%id%',obj.id);
            newHtml = newHtml.replace('%desc%',obj.description);
            newHtml = newHtml.replace('%val%',formatNumber(obj.value, type));   

            // Insert HTML to DOM
            document.querySelector(container).insertAdjacentHTML('beforeend',newHtml);

        },

        deleteListItem : function(divId) {
            var el = document.getElementById(divId);
            el.parentNode.removeChild(el);
        },

        displayBudget : function(budgetObj) {
            var type;
            budgetObj.budget > 0 ? type = 'inc' : type = 'exp';
            document.querySelector(DOMstrings.totalExpense).innerHTML = formatNumber(budgetObj.expenses, 'exp');
            document.querySelector(DOMstrings.totalBudget).innerHTML = formatNumber(budgetObj.budget, type);
            document.querySelector(DOMstrings.Percentage).innerHTML = budgetObj.percent + '%';
            document.querySelector(DOMstrings.totalIncome).innerHTML = formatNumber(budgetObj.income, 'inc');
            
            if (budgetObj.percent> 0){
                document.querySelector(DOMstrings.Percentage).innerHTML = budgetObj.percent + '%';
            } else {
                document.querySelector(DOMstrings.Percentage).innerHTML = '...';
            }
        },

        displayItemPercentages : function(percArr) {
            var fields = document.getElementsByClassName(DOMstrings.expPercentage);
            
            

            ForEachNode(fields, function(curr, idx) {
                if (percArr[idx] > 0) {
                    curr.innerHTML = percArr[idx] + '%'; 
                } else {
                    curr.innerHTML = '...';
                }
                
            });
        },

        clearFields : function () {
            var fields;
            fields = document.querySelectorAll(DOMstrings.inputDescription + ',' + DOMstrings.inputValue,);

            var fieldsArray = Array.prototype.slice.call(fields);

            fieldsArray.forEach(function(curr, idx, arr) {
                curr.value = "";
            });

            fieldsArray[0].focus();
        },

        displayDate : function() {
            var now,year, month, day, date;
            var monthList = ['January', 'February','March','April','May','June','July','August','September', 'October', 'November', 'December'];
            var dayList = ['Sunday','Monday','Tuesday','Wednesday','Thursday', 'Friday','Saturday'];
            now = new Date();
            year = now.getFullYear();
            month = now.getMonth();
            day = now.getDay();
            date = now.getDate();
            document.querySelector(DOMstrings.month).innerHTML = monthList[month] + ' ' + year;
            document.querySelector(DOMstrings.currentDate).innerHTML = dayList[day] + ', ' + date + ' ' + monthList[month] + ' ' + year;
        },

        getDOMstrings : function () {
            return DOMstrings;
        }
    };

})();

// Global Application Handler
var appController = (function(dataCtrl, UICtrl) {



    var setupEventListeners = function () {
        var DOM  = UICtrl.getDOMstrings();
        
        // Add new Item Button
        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);
        document.addEventListener('keypress', function (event) {
            // if (event.keyCode === 13) {
            if (event.keyCode === 13 || event.which === 13) {
                ctrlAddItem();
            }
            
        });

        // event listener for deleting the item
        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changeType);
    };

    var updateBudget = function() {
        // Calculate Budget
        dataCtrl.calculateBudget();
        // Return Budget
        var budget = dataCtrl.getBudget();
        // console.log(budget.percent);
        // Update UI
        UICtrl.displayBudget(budget);    
    };

    var updatePercentage = function() {
        // Calculate Percentage
        dataCtrl.calculatePercentage();
        // Read percentage value from database
        var percentages = dataCtrl.getPercentage();
        // Update the UI
        UICtrl.displayItemPercentages(percentages);
    };

    var ctrlAddItem = function () {
        
        var inputData, newItem;

        // Get Input Data
        inputData =  UICtrl.getInput();
        // console.log(inputData);

        if (inputData.description !== "" && !isNaN(inputData.value) && inputData.value > 0) {
            // add values to Database
            newItem = dataCtrl.addItem(inputData.type,inputData.description,inputData.value);
            // console.log(newItem);   
            // Update data to UI
            UICtrl.addListItem(inputData.type, newItem);
            // Clearing Fields
            UICtrl.clearFields();
            // Update Budget
            updateBudget();

            // Update Item %
            updatePercentage();
        }
    };

    var ctrlDeleteItem = function(event){
        var itemId,splitId,ID,type;
        itemId = event.target.parentNode.parentNode.parentNode.parentNode.id;
        // console.log(itemId);
        if (itemId) {
            splitId = itemId.split('-');
            type = splitId[0];
            ID = parseInt(splitId[1]);
            // Delete Item from Database
            dataCtrl.deleteItem(type, ID);  
            // Delete Item from UI
            UICtrl.deleteListItem(itemId);
            // Update Budget
            updateBudget();
            // Update Item %
            updatePercentage();
        };
    };

    return {
        init : function() {
            console.log('Application has started');
            UICtrl.displayDate();
            setupEventListeners();
            UICtrl.displayBudget({
                income :0,
                expenses : 0,
                budget : 0,
                percent : 0
            })
        }
    };
})(dataController, UIController);

appController.init();