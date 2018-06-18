/**
 * Copyright 2014 Ian Davies
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define([], function() {

    var Api = function ApiConstructor($resource, urlPrefix, $http, subject) {

        this.pages = $resource(urlPrefix + "/pages/:id");

        this.pageFragments = $resource(urlPrefix + "/pages/fragments/:id");

        this.pods = $resource(urlPrefix + "/pages/pods/" + subject.id);

        this.questionsPage = $resource(urlPrefix + "/pages/question_summary/top_boards_content");

        this.questionPages = $resource(urlPrefix + "/pages/questions/:id");

        this.conceptPages = $resource(urlPrefix + "/pages/concepts/:id");

        this.questionValidator = $resource(urlPrefix + "/questions/:id/answer", {}, {
            validate: {
                method: "POST",
            },
        });

        this.contactForm = $resource(urlPrefix + "/contact/", {}, {
            send: {
                method: "POST",
            },
        });

        this.gameBoards = $resource(urlPrefix + "/gameboards/:id", {id: "@id"}, {
            filter: {
                method: "GET",
                url: urlPrefix + "/gameboards",
            },
            wildcards: {
                method: "GET",
                url: urlPrefix + "/gameboards/wildcards",
                isArray: true 
            },
        });

        this.fastTrackGameboards = $resource(urlPrefix + "/gameboards/fasttrack/:id", {id: "@id"});

        this.contentProblems = $resource(urlPrefix + "/admin/content_problems");

        this.currentUser = $resource(urlPrefix + "/users/current_user", {}, {
            'getProgress': {
                method: 'GET',
                url: urlPrefix + "/users/current_user/progress",
            },
        });

        this.user = $resource("", { }, {
            'getProgress': {
                method: 'GET',
                url: urlPrefix + "/users/:userId/progress",
            },
            'getEventsOverTime' : {
                method: 'GET',
                url: urlPrefix + "/users/:userId/event_data/over_time?from_date=:from_date&to_date=:to_date&events=:events"
            },
            'getUserPreferences' : {
                method: 'GET',
                url: urlPrefix + "/users/user_preferences"
            },
            'getUserIdSchoolLookup' : {
                method: 'GET',
                url: urlPrefix + "/users/school_lookup?user_ids=:user_ids"
            },
        })

        this.authentication = $resource("", {}, {
            'getAuthRedirect': {
                method: 'GET',
                url: urlPrefix+"/auth/:provider/authenticate"
            },
            'getLinkRedirect': {
                method: 'GET',
                url: urlPrefix+"/auth/:provider/link",
            },
            'getAuthResult': {
                method: 'GET',
                url: urlPrefix+"/auth/:provider/callback",
            },
            'login': {
                method: 'POST',
                url: urlPrefix+"/auth/segue/authenticate",
            },
            'logout': {
                method: 'POST',
                url: urlPrefix+"/auth/logout",
            },
        });
        
        this.searchEndpoint = $resource(urlPrefix + "/search/:searchTerms?types=:types", {}, {
            'search': {
                method: 'GET', 
                isArray: false 
            },
        });

        this.adminUserSearch = $resource(urlPrefix + "/admin/users/:userId?email=:email", {}, {
            'search': {
                method: 'GET', 
                isArray: true 
            },
            'get' : {
                method: 'GET', 
                isArray: false 
            },
        });

        this.adminUserManagerChange = $resource("", {}, {
            'change_role' : {
                method : 'POST',
                isArray: true,
                url: urlPrefix+"/admin/users/change_role/:role",
                params: {role: "@role"}
            },
            'changeEmailVerificationStatus' : {
                method : 'POST',
                isArray: true,
                url: urlPrefix+"/admin/users/change_email_verification_status/:emailVerificationStatus/:checkEmailsExistBeforeApplying",
                params: {emailVerificationStatus: '@emailVerificationStatus'},
            }
        });

        this.statisticsEndpoint = $resource(urlPrefix + "/admin/stats/", {}, {
            'get' : {
                method: 'GET', 
                isArray: false 
            },
            'getGameboardPopularity' : {
                method: 'GET',
                url: urlPrefix + "/gameboards/popular", 
                isArray: false 
            },
            'getSchoolPopularity' : {
                method: 'GET',
                url: urlPrefix + "/admin/stats/schools/", 
                isArray: true 
            },
            'getSchoolUsers' : {
                method: 'GET',
                url: urlPrefix + "/admin/users/schools/:id", 
                params: {id: '@id'},
            },
            'getEventsOverTime' : {
                method: 'GET',
                url: urlPrefix + "/admin/users/event_data/over_time?from_date=:from_date&to_date=:to_date&events=:events&bin_data=:bin_data"
            },
            'getUserLocations' : {
                method: 'GET',
                url: urlPrefix + "/admin/stats/users/last_locations?from_date=:from_date&to_date=:to_date", 
                isArray: true 
            },
            'getLogEventTypes' : {
                method: 'GET',
                url: urlPrefix + "/info/log_event_types",
            },          
        });

        this.makeDownloadEventsOverTimeLink = function(startDate, endDate, events, binData) {
            return urlPrefix + "/admin/users/event_data/over_time/download?from_date=" + startDate + "&to_date=" + endDate + "&events=" + events.join() + "&bin_data=" + binData;
        }

        this.adminDeleteUser = $resource(urlPrefix + "/admin/users/:userId", {}, {
            'delete' : {
                method: 'DELETE'
            },
        });

        this.groupManagementEndpoint = $resource(urlPrefix + "/groups/:id?archived_groups_only=:archived_groups_only", {id: "@id"}, {
            'get' : {
                method: 'GET', 
                isArray: true 
            },
            'delete' :{
                method: 'DELETE',
                url: urlPrefix + "/groups/:id", 
                isArray: true
            },
            'getMembers' : {
                method: 'GET',
                url: urlPrefix + "/groups/:id/membership", 
                isArray: true 
            },
            'deleteMember' : {
                method: 'DELETE',
                url: urlPrefix + "/groups/:id/membership/:userId", 
                isArray: true 
            },          
            'getToken' : {
                method: 'GET',
                url: urlPrefix + "/authorisations/token/:id", 
                isArray: false 
            },
            'addManager' : {
                method: 'POST',
                url: urlPrefix + "/groups/:id/manager", 
                isArray: false 
            },
            'deleteManager' : {
                method: 'DELETE',
                url: urlPrefix + "/groups/:id/manager/:userId", 
                isArray: false 
            },
        });

        this.authorisations = $resource(urlPrefix + "/authorisations/", {}, {
            'get' : {
                method: 'GET', 
                isArray: true 
            },
            'useToken' : {
                method: 'POST',
                url: urlPrefix + "/authorisations/use_token/:token",
                params: {token: '@token'}
            },          
            'revoke' : {
                method: 'DELETE',
                url: urlPrefix + "/authorisations/:id" 
            },
            'revokeAll' : {
                method: 'DELETE',
                url: urlPrefix + "/authorisations/" 
            },            
            'release' : {
                method: 'DELETE',
                url: urlPrefix + "/authorisations/release/:id" 
            },
            'releaseAll' : {
                method: 'DELETE',
                url: urlPrefix + "/authorisations/release/" 
            },           
            'getOthers' : {
                method: 'GET',
                url: urlPrefix + "/authorisations/other_users", 
                isArray: true 
            },
            'getTokenOwner' : {
                method: 'GET',
                url: urlPrefix + "/authorisations/token/:token/owner", 
                isArray: true 
            },              
        }); 

        this.assignments = $resource(urlPrefix + "/assignments/", {}, {
            'getMyAssignments' : {
                method: 'GET', 
                isArray: true,
                params: {assignmentStatus: '@assignmentStatus'}
            },
            'getAssignmentsOwnedByMe' : {
                method: 'GET', 
                isArray: true,
                url: urlPrefix + "/assignments/assign", 
            },
            'getAssignedGroups' : {
                method: 'GET', 
                //isArray: true,
                url: urlPrefix + "/assignments/assign/groups?gameboard_ids=:gameboard_ids"
            },                  
            'assignBoard' : {
                method: 'POST',
                url: urlPrefix + "/assignments/assign/"
            },          
            'unassignBoard' : {
                method: 'DELETE',
                url: urlPrefix + "/assignments/assign/:gameId/:groupId",
                params: {gameId: '@gameId', groupId: '@groupId'}
            },
            'getProgress': {
                method: 'GET',
                url: urlPrefix + "/assignments/assign/:assignmentId/progress",
                isArray: true,
            },
        });         

        this.events = $resource(urlPrefix + "/events/:id");
        
        this.eventOverview = $resource(urlPrefix + "/events/overview?start_index=:startIndex&limit=:limit&show_active_only=:showActiveOnly&show_inactive_only=:showInactiveOnly");

        this.eventMapData = $resource(urlPrefix + "/events/map_data?start_index=:startIndex&limit=:limit&show_active_only=:showActiveOnly");

        this.eventBookings = $resource(urlPrefix + "/events/:eventId/bookings/:userId", {eventId: '@eventId', userId: '@userId'}, {
            'getAllBookings' : {
                url: urlPrefix + "/events/bookings",
                method: 'GET', 
            },
            'getBookings' : {
                url: urlPrefix + "/events/:eventId/bookings",
                method: 'GET', 
                isArray: true
            },
            'makeBooking' : {
                method: 'POST', 
                url: urlPrefix + "/events/:eventId/bookings/:userId"            
            },
            'requestBooking' : {
                method: 'POST', 
                url: urlPrefix + "/events/:eventId/bookings"
            },
            'addToWaitingList' : {
                method: 'POST', 
                url: urlPrefix + "/events/:eventId/waiting_list"
            },
            'deleteBooking' : {
                method: 'DELETE', 
                url: urlPrefix + "/events/:eventId/bookings/:userId"            
            },
            'promoteFromWaitList' : {
                method: 'POST', 
                url: urlPrefix + "/events/:eventId/bookings/:userId/promote"            
            },
            'cancelBooking' : {
                method: 'DELETE', 
                url: urlPrefix + "/events/:eventId/bookings/:userId/cancel"         
            },
            'cancelMyBooking' : {
                method: 'DELETE', 
                url: urlPrefix + "/events/:eventId/bookings/cancel"         
            },
            'resendConfirmation' : {
                method: 'POST', 
                url: urlPrefix + "/events/:eventId/bookings/:userId/resend_confirmation"            
            },
            'recordEventAttendance' : {
                method: 'POST',
                url: urlPrefix + "/events/:eventId/bookings/:userId/record_attendance",
                params: {attended: '@attended'}
            }
        }); 

        // allows the resource to be constructed with a promise that can be used to cancel a request
        this.getQuestionsResource = function() {
            return $resource(urlPrefix + "/pages/questions", {}, {
                'query': {
                    method: 'GET', isArray: false, params: {searchString:"@searchString", tags:"@tags", levels:"@levels", fasttrack: "@fasttrack", start_index:"@startIndex", limit:"@limit"}
                }
            })
        };

        this.getUnits = function() { return $http.get(urlPrefix + "/content/units").then(function (r) { return r.data; }); };

        var questionsPerPage = 10;
        var questionList = $resource(urlPrefix + "/pages/questions?searchString=:searchString&tags=:tags&start_index=:startIndex&limit=:limit", {}, {'query': {method: 'GET', isArray: false }});
        var conceptList = $resource(urlPrefix + "/pages/concepts?start_index=:startIndex&limit=:limit", {startIndex: 0, limit: 999}, {'query': {method: 'GET', isArray: false }});
        var gameBoardsList = $resource(urlPrefix + "/users/current_user/gameboards?start_index=:startIndex&sort=:sort:filter:limit", {}, {'query': {method: 'GET', isArray: false }});
        var deleteBoard = $resource(urlPrefix + "/users/current_user/gameboards/:id", {}, {'query': {method: 'DELETE'}});
        var saveBoard = $resource(urlPrefix + "/users/current_user/gameboards/:id", {}, {'query': {method: 'POST'}});
        var eventsList = $resource(urlPrefix + "/events");

        this.getQuestionList = function(page){
            return questionList.query({"startIndex" : page*questionsPerPage, "limit" : questionsPerPage});
        }

        this.userGameBoards = function(filter, sort, index, limit){
            return gameBoardsList.query({"filter" : (filter != null) ? '&show_only='+filter : '', "sort" : sort, "startIndex" : index, "limit" : (limit != null) ? '&limit='+limit : ''});
        }
        
        this.deleteGameBoard = function(id){
            return deleteBoard.query({"id" : id});
        }

        this.saveGameBoard = function(id) {
            return saveBoard.query({"id": id}, {});
        }
     
        this.removeLinkedAccount = function(provider) {
            return $http.delete(urlPrefix + "/auth/"+provider+"/link");
        }

        this.linkAccount = function(provider, target){
            $http.get(urlPrefix + "/auth/"+provider+"/link?redirect=http://" + target);
        }

        this.getConceptList = function(){
            return conceptList.query();
        }

        this.getEventsList = function(startIndex, limit, showActiveOnly, showInactiveOnly, tags, showBookedOnly) {
            return eventsList.get({start_index: startIndex, limit: limit, show_active_only: showActiveOnly, show_inactive_only: showInactiveOnly, tags: tags, show_booked_only:showBookedOnly});
        }

        this.getImageUrl = function(path) {
            // Check if the image source is a fully qualified link (suggesting it is external to the Isaac site),
            // or else an asset link served by the APP, not the API.
            if ((path.indexOf("http") > -1) || (path.indexOf("/assets/") > -1)) {
                return path;
            } else {
                return urlPrefix + "/images/" + path;
            }
        }

        this.getTagsUrl = function() {
            return urlPrefix + "/content/tags";
        }

        this.getUnitsUrl = function() {
            return urlPrefix + "/content/units";
        }

        // this.admin = {
        //  synchroniseDatastores: function() {
        //      return $http.post(urlPrefix + "/admin/synchronise_datastores").then(function() {
        //          console.warn("Synchronising Datastores. The next page load will take a while.");
        //      });
        //  }
        // };

        this.account = $resource(urlPrefix + "/users", {}, {
            saveSettings: {
                method: "POST",
            }
        });

        this.schools = $resource(urlPrefix + "/schools", {}, {
            'get': {
                method: 'GET', 
                isArray: false 
            },
            'getSchoolOther' : {
                url: urlPrefix + "/users/schools_other",
                method: 'GET', 
                isArray: true
            },
        })

        this.environment = $resource(urlPrefix + "/info/segue_environment");

        this.segueInfo = $resource(urlPrefix + "/search/:searchTerms?types=:types", {}, {
            "segueVersion": {
                method: "GET",
                url: urlPrefix + "/info/segue_version",
            },
            "cachedVersion": {
                method: "GET",
                url: urlPrefix + "/info/content_versions/cached",
            },
        });

        this.password = $resource(urlPrefix + "/users/resetpassword/:token", null, {
            reset: {
                method: "POST",
            },
        });

        this.emailVerification = $resource(urlPrefix + "/users/verifyemail/:userid/:token", null, {
            verify: {
                method: "GET"
            },
        });

        this.verifyEmail = $resource(urlPrefix + "/users/verifyemail", null, {
            requestEmailVerification: {
                method: "POST"
            },
        });

        this.email = $resource(urlPrefix + "", null, {
            get: {
                method: "GET",
                url: urlPrefix + "/email/viewinbrowser/:id",
                isArray:false
            },
            getPreferences: {
                method: "GET",
                url: urlPrefix + "/email/preferences",
                isArray:true
            },
            sendEmail : {
                method: "POST",
                url: urlPrefix + "/email/sendemail/:contentid/:emailtype",
            }, 
            sendEmailWithIds : {
                method: "POST",
                url: urlPrefix + "/email/sendemailwithuserids/:contentid/:emailtype",
                isArray:true
            },
            getQueueSize : {
                method: "GET",
                url: urlPrefix + "/email/queuesize",
            }
        });

        this.logger = $resource(urlPrefix + "/log", {}, {
            log : {
                method: "POST",
            },
        })

        this.contentVersion = $resource("", {}, {
            "get": {
                method: "GET",
                url: urlPrefix + "/info/content_versions/live_version",
            },
            "set": {
                method: "POST",
                url: urlPrefix + "/admin/live_version/:version",
            },
            "currentIndexQueue" : {
                method: "GET",
                url: urlPrefix + "/admin/content_index_queue",
            },
            "emptyIndexQueue" : {
                method: "DELETE",
                url: urlPrefix + "/admin/content_index_queue",
            }           
        });

        this.notifications = $resource(urlPrefix + "/notifications", {}, {
            "respond": {
                method: "POST",
                url: urlPrefix + "/notifications/:id/:response",
            }
        })
        
        this.getCSVDownloadLink = function(assignmentId) {
            return urlPrefix + "/assignments/assign/" + assignmentId + "/progress/download";
        }

        this.getGroupProgressCSVDownloadLink = function(groupId) {
            return urlPrefix + "/assignments/assign/group/" + groupId + "/progress/download";
        }

        this.questionsAnswered = $resource(urlPrefix + "/stats/questions_answered/count");

        this.getWebsocket = function(uri) {
            // FIXME: this seems a little hacky, and not as neat as the rest . . .
            if (urlPrefix.indexOf("http") > -1) {
                // APP and API on separate domains, urlPrefix is full URL:
                return new WebSocket(urlPrefix.replace(/^http/, "ws") + "/" + uri);
            } else {
                // APP and API on same domain, need window.location.origin for full URL:
                return new WebSocket(window.location.origin.replace(/^http/, "ws") + urlPrefix + "/" + uri);
            }

        }

    }

    return Api;
});