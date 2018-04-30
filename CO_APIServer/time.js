        
        Date.prototype.addSeconds = function(seconds) {
            this.setSeconds(this.getSeconds() + seconds);
            return this;
        };

        Date.prototype.addMinutes = function(minutes) {
            this.setMinutes(this.getMinutes() + minutes);
            return this;
        };

        Date.prototype.addHours = function(hours) {
            this.setHours(this.getHours() + hours);
            return this;
        };

        Date.prototype.addDays = function(days) {
            this.setDate(this.getDate() + days);
            return this;
        };

        Date.prototype.addWeeks = function(weeks) {
            this.addDays(weeks*7);
            return this;
        };

        Date.prototype.addMonths = function (months) {
            var dt = this.getDate();

            this.setMonth(this.getMonth() + months);
            var currDt = this.getDate();

            if (dt !== currDt) {  
                this.addDays(-currDt);
            }

            return this;
        };

        Date.prototype.addYears = function(years) {
            var dt = this.getDate();

            this.setFullYear(this.getFullYear() + years);

            var currDt = this.getDate();

            if (dt !== currDt) {  
                this.addDays(-currDt);
            }

            return this;
        };



var now = new Date();
console.log("Nu ", now)
var offset= -now.getTimezoneOffset();
now.addMinutes(offset);
console.log("Nu rätt tidzon:  ", now)
console.log("Nu + 30 dagar: ", now.addDays(30));
//console.log("Nu + 30 minuter: ", now.addMinutes(30));
//console.log("Nu + 3 veckor:   ", now.addWeeks(3));
//console.log("Nu + 3 månader:  ", now.addMonths(3));