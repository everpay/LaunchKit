/**
 * @license
 * Copyright 2016 Cluster Labs, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var dom = skit.browser.dom;
var Controller = skit.platform.Controller;
var iter = skit.platform.iter;
var navigation = skit.platform.navigation;
var urls = skit.platform.urls;

var ButtonOverlay = library.overlays.ButtonOverlay;
var Dashboard = library.controllers.Dashboard;
var LKAPIClient = library.api.LKAPIClient;

var html = __module__.html;


var NEXT_URL = '/reviews/dashboard/';


module.exports = Controller.create(Dashboard, {
  __preload__: function(done) {
    if (navigation.query()['force']) {
      done();
      return;
    }

    LKAPIClient.reviewSubscriptions({
      onSuccess: function(subscriptions) {
        iter.forEach(subscriptions, function(sub, i, stop) {
          if (sub.slackUrl) {
            navigation.navigate(NEXT_URL);
            stop();
          }
        });
      },
      onComplete: done,
      context: this
    });
  },

  __body__: function() {
    return {
      content: html({
        nextUrl: NEXT_URL
      })
    }
  },

  __ready__: function() {
    var $form = dom.get('#add-webhook-form');
    this.bind($form, 'submit', this.onSubmitForm, this);
  },

  onSubmitForm: function(evt) {
    evt.preventDefault();
    var $form = evt.target;

    var slackUrl = $form.serializeForm()['url'];
    var $toDisable = $form.find('input, button');
    iter.forEach($toDisable, function($e) {
      $e.disable();
    });

    LKAPIClient.subscribeToReviewsWithSlackUrl(slackUrl, {
      onSuccess: function() {
        navigation.navigate(NEXT_URL);
      },
      onError: function() {
        iter.forEach($toDisable, function($e) {
          $e.enable();
        });

        var error = new ButtonOverlay('Whoops!', 'Looks like we could not add that URL — please verify it is a valid slack webhook URL.');
        error.addButton('Okay');
        error.show();
      },
      context: this
    });
  }
});