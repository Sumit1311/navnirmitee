var navToysDAO = require(process.cwd() + "/lib/dao/toys/navToysDAO.js"),
    navSkillsDAO = require(process.cwd() + "/lib/dao/skills/navSkillsDAO.js"),
    navRentalsDAO = require(process.cwd() + "/lib/dao/rentals/navRentalsDAO.js"),
    navSystemUtil = require(process.cwd() + "/lib/navSystemUtil.js"),
    navCommonUtil = require(process.cwd() + "/lib/navCommonUtil.js"),
    navLogicalException = require("node-exceptions").LogicalException,
    navLogUtil = require(process.cwd() + "/lib/navLogUtil.js"),
    Q = require('q');

module.exports = class navToysHandler {
   constructor(client) {
       this.client = client;
   }

  getToysList(isLoggedIn, offset, limit, filters, sorters) {
      var promise = Q.resolve();
      var self = this;
      var l_offset = offset || 0, l_limit = limit || 10, noOfPages;
      if(isLoggedIn !== undefined && isLoggedIn !== null) {
          noOfPages = 1;
          if(isLoggedIn){
              promise = (new navToysDAO()).getAllToys(l_offset, l_limit);
          }
          else{
              promise = (new navToysDAO()).getAllToys(l_offset, l_limit);
          }
      } else {
          promise = new navToysDAO().getAllToys(null, null, filters.ageGroups, filters.categories, filters.keywords , sorters[0].column, sorters[0].type, filters.skills, filters.brands);
      }

      var toyList = [];
      return promise
          .then((toys) => {
                if(toys.length % l_limit !== 0 ) {
                    noOfPages = Math.floor(toys.length / l_limit) + 1;
                } else {
                    noOfPages = Math.floor(toys.length / l_limit) ;

                }
                var i;
                for(i = 0; i < toys.length; i++) {
                    if(i >= l_offset) {
                        toyList.push(toys[i]);
                    }
                    if(toyList.length == l_limit) {
                        break;
                    }
                }

              var promises = [];
              for(var z = 0; z < toyList.length; z++) {
                  promises.push(new navSkillsDAO().getSkillsForToy(toyList[z]._id));
              }
              return Q.allSettled(promises);
          })
      .then(function(results){
          for(var w = 0; w < results.length; w++) {
              if(results[w].state == 'rejected') {
                  return Q.reject(results[w].reason)
              }
              toyList[w].skills = results[w].value;
          }
          return Q.resolve({
            toys : toyList,
            noOfPages : noOfPages,
            perPageToys : l_limit
          });
      })
      .catch((error) => {
          navLogUtil.instance().log.call(self, self.getToysList.name, "Error occured  " + error, "error");
          return Q.reject(error);
      })
  }

  getToyDetail(toyId) {
        var tDAO = new navToysDAO(this.client), self = this, toy, imageCount;
        return tDAO.getToyDetailById(toyId)
            .then(function(toyDetail){
                if(toyDetail.length === 0) {
                    return Q.reject(new navLogicalException());
                }
                toy = toyDetail;
                toy[0].brand = navCommonUtil.getBrands()[toy[0].brand].name;
                //console.log(toy);
                toy[0].ageGroup = navCommonUtil.getAgeGroups()[toy[0].age_group];
                return new navSystemUtil().getNoOfFilesMatchPat(toyDetail[0]._id+'_*',process.cwd() + '/../public/img/toys/');
            })
            .then(function(count){
                imageCount = count;
                return new navSkillsDAO().getSkillsForToy(toyId);
            })
            .then((n_skills) => {
                toy[0].skills = n_skills
                return new navRentalsDAO().getCountOfPendingOrders(toyId); 
            })
            .then(function(count){
                toy[0].stock = toy[0].stock - parseInt(count);
                return Q.resolve({
                    toyDetail : toy[0],
                    imageCount : imageCount
                });
            })
            .catch(function(error){
                navLogUtil.instance().log.call(self,self.getToyDetail.name, 'Error occured ' + error.stack, "error");
                return Q.reject(error);
            });
  }

  getOnRent(toyId) {
      var self = this;
      return new navToysDAO(this.client).updateToyStock(toyId, 1)
          .then(() => {
                navLogUtil.instance().log.call(self, self.getOnRent.name, "Updating stock of toy : "+toyId , "info");
               return Q.resolve(); 
          })
          .catch((error) => {
              return Q.reject(error);
          })
  }

  returnFromRent(toyId) {
      var self = this;
      return new navToysDAO(this.client).updateToyStock(toyId, 1, true)
          .then(() => {
                navLogUtil.instance().log.call(self, self.getOnRent.name, "Updating stock of toy : "+toyId , "info");
               return Q.resolve(); 
          })
          .catch((error) => {
              return Q.reject(error);
          })
  }
}
