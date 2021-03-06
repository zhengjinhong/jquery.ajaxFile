/*!
 * AjaxFile.js - V0.2.0
 * Project repository: https://github.com/fpellet/jquery.ajaxFile
 * Licensed under the MIT license
 */
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else {
        window.AjaxFile = factory(typeof jQuery != 'undefined' ? jQuery : window.Zepto);
    }
}(function ($) {
    'use strict';
    var DataType;
    (function (DataType) {
        DataType[DataType['Json'] = 0] = 'Json';
        DataType[DataType['Xml'] = 1] = 'Xml';
        DataType[DataType['Text'] = 2] = 'Text';
    }(DataType || (DataType = {})));
    var ajaxFile = {
        send: function (option) {
            option = mergeWithDefaultOption(option);
            var request = new Request(option);
            request.initialize();
            return request.submit();
        },
        DataType: DataType
    };
    var AjaxFilePromise = function () {
        function AjaxFilePromise(abordCallback, register) {
            var deferred = $.Deferred();
            this.promise = deferred.promise();
            this.abordCallback = abordCallback;
            register(function (result) {
                return deferred.resolve(result);
            }, function (result) {
                return deferred.reject(result);
            });
        }
        AjaxFilePromise.prototype.then = function (success, error) {
            this.promise = this.promise.then(success, error);
            return this;
        };
        AjaxFilePromise.prototype.done = function (success) {
            this.promise = this.promise.done(success);
            return this;
        };
        AjaxFilePromise.prototype.fail = function (error) {
            this.promise = this.promise.fail(error);
            return this;
        };
        AjaxFilePromise.prototype.always = function (complete) {
            this.promise = this.promise.always(complete);
            return this;
        };
        AjaxFilePromise.prototype.abord = function () {
            if (!this.abordCallback) {
                this.abordCallback();
            }
        };
        return AjaxFilePromise;
    }();
    function readCookie(name) {
        var value = (document.cookie.match('(^|; )' + name + '=([^;]*)') || 0)[2];
        return decodeURIComponent(value) || null;
    }
    ;
    function hasCookie(name) {
        return document.cookie.indexOf(name + '=') !== -1;
    }
    ;
    function clearCookie(name) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
    ;
    var CookieReponseHandler = function () {
        function CookieReponseHandler(id) {
            this.cookieName = id;
        }
        CookieReponseHandler.prototype.onReceived = function (option, form, receivedCallback) {
            var _this = this;
            this.receivedCallback = receivedCallback;
            setTimeout(function () {
                return _this.checkCookie();
            }, 100);
        };
        CookieReponseHandler.prototype.checkCookie = function () {
            var _this = this;
            if (this.disposed) {
                return;
            }
            if (!hasCookie(this.cookieName)) {
                setTimeout(function () {
                    return _this.checkCookie();
                }, 100);
                return;
            }
            var value = readCookie(this.cookieName);
            var response = createCookieResponseDocument(value);
            this.receivedCallback(response);
        };
        CookieReponseHandler.prototype.dispose = function () {
            this.disposed = true;
            clearCookie(this.cookieName);
            this.receivedCallback = null;
        };
        return CookieReponseHandler;
    }();
    var Form;
    (function (Form_1) {
        'use strict';
        var Form = function () {
            function Form(option) {
                this.option = option;
            }
            Form.prototype.initialize = function (requestId) {
                this.addRequestIdInData(requestId);
                this.formFragment = createFormFragment(this.option, requestId);
                insertFormFragment(this.formFragment);
            };
            Form.prototype.addRequestIdInData = function (requestId) {
                this.option.data.__requestId = requestId;
            };
            Form.prototype.onLoaded = function (loadCallback) {
                var iframe = this.formFragment.iframe;
                iframe.on('load', loadCallback);
            };
            Form.prototype.submit = function () {
                this.formFragment.form.submit();
            };
            Form.prototype.getResponseDocument = function () {
                var document = getDocumentOfIFrame(this.formFragment.iframe);
                if (!document) {
                    throw 'server abort';
                }
                var orgineUrl = this.formFragment.iframe.attr('origineSrc');
                return new FormResponseDocument(document, orgineUrl);
            };
            Form.prototype.abord = function () {
                abordIFrame(this.formFragment.iframe);
            };
            Form.prototype.dispose = function () {
                if (this.formFragment) {
                    this.formFragment.container.remove();
                    this.formFragment = null;
                }
            };
            return Form;
        }();
        function abordIFrame($iframe) {
            try {
                var iframe = $iframe[0];
                var documentOfIFrame = iframe.contentWindow.document;
                if (documentOfIFrame.execCommand) {
                    documentOfIFrame.execCommand('Stop');
                }
            } catch (ignore) {
            }
            $iframe.attr('src', $iframe.attr('origineSrc'));
        }
        ;
        function createFormFragment(option, requestId) {
            option.data.__requestId = requestId;
            var iframe = createIFrame(requestId, currentPageIsHttpsMode());
            var form = createHtmlForm(option, requestId);
            var container = $('<div></div>');
            container.hide();
            container.append(iframe);
            container.append(form);
            return {
                container: container,
                form: form,
                iframe: iframe
            };
        }
        ;
        function insertFormFragment(formFragment) {
            formFragment.container.appendTo('body');
        }
        ;
        function getDocumentOfIFrame($iframe) {
            var iframe = $iframe[0];
            try {
                if (iframe.contentWindow) {
                    return iframe.contentWindow.document;
                }
            } catch (ignore) {
            }
            try {
                // simply checking may throw in ie8 under ssl or mismatched protocol
                return iframe.contentDocument ? iframe.contentDocument : iframe.document;
            } catch (ignore) {
            }
            return iframe.document;
        }
        ;
        function createIFrame(id, isHttps) {
            var iframe = $('<iframe name="' + id + '"></iframe>');
            var src = isHttps ? 'javascript:false' : 'about:blank';
            iframe.attr('src', src);
            iframe.attr('origineSrc', src);
            return iframe;
        }
        function createHtmlForm(option, iframeId) {
            var form = $('<form></form>');
            form.attr('method', option.method);
            form.attr('action', option.url);
            form.attr('target', iframeId);
            form.attr('encoding', 'multipart/form-data');
            form.attr('enctype', 'multipart/form-data');
            if (option.method.toLowerCase() === 'GET') {
                applyGetMethodOnForm(form, option);
            } else {
                applyPostMethodOnForm(form, option);
            }
            cloneAndMoveInputFiles(form, option.files);
            return form;
        }
        ;
        function cloneAndMoveInputFiles(form, files) {
            $.each(files, function (num, file) {
                cloneAndMoveInputFile(form, file);
            });
        }
        ;
        function cloneAndMoveInputFile(form, file) {
            var input = $(file.element);
            input.replaceWith(input.clone(true, true));
            input.attr('name', file.name);
            input.off();
            form.append(file.element);
        }
        ;
        function urlHasAlreadyParameters(url) {
            return url.indexOf('?') !== -1;
        }
        function applyGetMethodOnForm(form, option) {
            var urlParameters = $.param(option.data);
            var url = option.url + (urlHasAlreadyParameters(option.url) ? '&' : '?') + urlParameters;
            form.attr('action', url);
            return form;
        }
        ;
        function applyPostMethodOnForm(form, option) {
            form.attr('action', option.url);
            var parameters = JsonToPostDataConverter.convert(option.data);
            $.each(parameters, function (num, parameter) {
                var input = $('<input type="hidden" />');
                input.attr('name', parameter.name);
                input.val(parameter.value);
                input.appendTo(form);
            });
            return form;
        }
        ;
        function createForm(option, requestId) {
            var form = new Form(option);
            form.initialize(requestId);
            return form;
        }
        Form_1.createForm = createForm;
        ;
    }(Form || (Form = {})));
    var FormResponseHandler = function () {
        function FormResponseHandler() {
        }
        FormResponseHandler.prototype.onReceived = function (option, form, receivedCallback) {
            var _this = this;
            this.form = form;
            this.form.onLoaded(function () {
                return _this.onStateUpdated();
            });
            this.receivedCallback = receivedCallback;
        };
        FormResponseHandler.prototype.onStateUpdated = function () {
            var _this = this;
            try {
                var documentOfIFrame = this.form.getResponseDocument();
                if (!documentOfIFrame) {
                    this.receivedCallback(createErrorResponseDocument('server abort'));
                    return;
                }
                if (!documentOfIFrame.isLoaded()) {
                    setTimeout(function () {
                        return _this.onStateUpdated();
                    }, 250);
                    return;
                }
                this.receivedCallback(documentOfIFrame);
            } catch (error) {
                this.receivedCallback(createErrorResponseDocument(error));
            }
        };
        FormResponseHandler.prototype.dispose = function () {
            if (this.form) {
                this.form.dispose();
                this.form = null;
            }
            this.receivedCallback = null;
        };
        return FormResponseHandler;
    }();
    var defaultOption = {
        data: {},
        files: [],
        desiredResponseDataType: DataType.Json,
        method: 'POST',
        timeoutInSeconds: 60
    };
    function mergeWithDefaultOption(option) {
        option = $.extend(true, {}, defaultOption, option);
        if (!option.url) {
            option.url = getCurrentUrlWithoutHash();
        }
        return option;
    }
    ;
    var ReponseHandlerDispatcher = function () {
        function ReponseHandlerDispatcher(id) {
            var cookieHandler = new CookieReponseHandler(id);
            this.handlers = [
                new TimeoutResponseHandler(),
                new FormResponseHandler(),
                cookieHandler
            ];
        }
        ReponseHandlerDispatcher.prototype.onReceived = function (option, form, receivedCallback) {
            this.handlers.forEach(function (handler) {
                handler.onReceived(option, form, receivedCallback);
            });
        };
        ReponseHandlerDispatcher.prototype.dispose = function () {
            this.handlers.forEach(function (handler) {
                handler.dispose();
            });
        };
        return ReponseHandlerDispatcher;
    }();
    function generateRequestId() {
        return 'ajaxFile' + new Date().getTime();
    }
    var Request = function () {
        function Request(option) {
            this.option = option;
            this.id = generateRequestId();
            this.responseHandler = new ReponseHandlerDispatcher(this.id);
        }
        Request.prototype.initialize = function () {
            this.form = Form.createForm(this.option, this.id);
        };
        Request.prototype.submit = function () {
            var _this = this;
            var promise = new AjaxFilePromise(function () {
                return _this.abord();
            }, function (successCallback, errorCallback) {
                _this.successCallback = successCallback;
                _this.errorCallback = errorCallback;
            });
            setTimeout(function () {
                return _this.send();
            }, 10);
            return promise.always(function () {
                return _this.dispose();
            });
        };
        Request.prototype.send = function () {
            var _this = this;
            if (this.isCompleted) {
                return;
            }
            this.responseHandler.onReceived(this.option, this.form, function (response) {
                return _this.onResponseReceived(response);
            });
            try {
                this.form.submit();
            } catch (err) {
                this.onError('error', err);
            }
        };
        Request.prototype.onResponseReceived = function (response) {
            if (this.isCompleted) {
                return;
            }
            try {
                var result = response.read(this.option.desiredResponseDataType);
                if (result.status.isSuccess) {
                    this.successCallback(result);
                } else {
                    this.errorCallback(result);
                }
            } catch (error) {
                this.onError('error', error);
            }
            this.isCompleted = true;
        };
        Request.prototype.abord = function (reason) {
            this.onError(reason || 'cancelled');
        };
        Request.prototype.onError = function (error, status, data) {
            if (this.isCompleted) {
                return;
            }
            this.isCompleted = true;
            this.form.abord();
            this.errorCallback({
                status: status,
                data: data,
                error: error
            });
        };
        Request.prototype.dispose = function () {
            this.isCompleted = true;
            if (this.form) {
                this.form.dispose();
                this.form = null;
            }
            if (this.responseHandler) {
                this.responseHandler.dispose();
                this.responseHandler = null;
            }
        };
        return Request;
    }();
    function createErrorResponseDocument(error) {
        return {
            read: function () {
                throw error;
            }
        };
    }
    ;
    function createCookieResponseDocument(value) {
        return {
            read: function (desiredDataType) {
                var data = parse(value, desiredDataType);
                return {
                    status: extractStatus(),
                    data: data
                };
            }
        };
    }
    ;
    var FormResponseDocument = function () {
        function FormResponseDocument(document, origineUrl) {
            this.document = document;
            this.origineUrl = origineUrl;
        }
        FormResponseDocument.prototype.isLoaded = function () {
            if (!this.hrefHasChanged()) {
                return false;
            }
            if (this.isXml()) {
                return true;
            }
            return this.document.body !== null && !!this.document.body.innerHTML;
        };
        FormResponseDocument.prototype.hrefHasChanged = function () {
            return this.document.location.href !== this.origineUrl;
        };
        FormResponseDocument.prototype.isXml = function () {
            return this.document.XMLDocument || $.isXMLDoc(this.document);
        };
        FormResponseDocument.prototype.read = function (desiredDataType) {
            var container = this.searchContainer();
            var status = extractStatus(container);
            var data = parse(container.val(), desiredDataType);
            return {
                status: status,
                data: data
            };
        };
        FormResponseDocument.prototype.searchContainer = function () {
            var container = this.document.getElementsByTagName('textarea')[0];
            if (!container) {
                throw 'Cannot find textarea in response';
            }
            return $(container);
        };
        return FormResponseDocument;
    }();
    function extractStatus(container) {
        var status = {
            code: 200,
            text: 'OK',
            isSuccess: true
        };
        if (container) {
            var code = Number(container.attr('statusCode')) || status.code;
            status.code = code;
            status.text = container.attr('statusText') || status.text;
            status.isSuccess = code >= 200 && code < 300 || code === 304;
        }
        return status;
    }
    ;
    function parse(value, desiredDataType) {
        if (!value) {
            return null;
        }
        switch (desiredDataType) {
        case DataType.Text:
            return value;
        case DataType.Json:
            return $.parseJSON(value);
        case DataType.Xml:
            var xml = $.parseXML(value);
            if (xml.documentElement.nodeName === 'parsererror') {
                throw 'parsererror';
            }
            return xml;
        default:
            throw 'Invalid datatype : ' + desiredDataType;
        }
    }
    ;
    var TimeoutResponseHandler = function () {
        function TimeoutResponseHandler() {
        }
        TimeoutResponseHandler.prototype.onReceived = function (option, form, receivedCallback) {
            this.dispose();
            if (option.timeoutInSeconds) {
                var timeoutInMilliseconds = option.timeoutInSeconds * 1000;
                this.timeoutHandle = setTimeout(function () {
                    receivedCallback(createErrorResponseDocument('Timeout'));
                }, timeoutInMilliseconds);
            }
        };
        TimeoutResponseHandler.prototype.dispose = function () {
            if (this.timeoutHandle) {
                clearTimeout(this.timeoutHandle);
                this.timeoutHandle = null;
            }
        };
        return TimeoutResponseHandler;
    }();
    function getCurrentUrlWithoutHash() {
        var currentUrl = window.location.href;
        return (currentUrl.match(/^([^#]+)/) || [])[1];
    }
    function currentPageIsHttpsMode() {
        return urlIsHttpsMode(window.location.href);
    }
    function urlIsHttpsMode(url) {
        return /^https/i.test(url || '');
    }
    var JsonToPostDataConverter;
    (function (JsonToPostDataConverter) {
        'use strict';
        function pushParameters(results, data, prefix) {
            if (!data) {
                return;
            }
            for (var propertyName in data) {
                if (!data.hasOwnProperty(propertyName)) {
                    continue;
                }
                var value = data[propertyName];
                if (!value) {
                    continue;
                }
                pushParameterOfProperty(results, propertyName, data[propertyName], prefix);
            }
        }
        ;
        function pushParameterOfProperty(results, propertyName, value, prefix) {
            var parameterName = prefix ? prefix + '[' + propertyName + ']' : propertyName;
            var type = Object.prototype.toString.call(value);
            if (type === '[object Array]') {
                value.forEach(function (item, index) {
                    pushParameters(results, item, parameterName + '[' + index + ']');
                });
                return;
            }
            if (type === '[object Object]') {
                pushParameters(results, value, parameterName);
                return;
            }
            results.push({
                name: parameterName,
                value: value + ''
            });
        }
        ;
        function convert(data) {
            var result = [];
            pushParameters(result, data);
            return result;
        }
        JsonToPostDataConverter.convert = convert;
        ;
    }(JsonToPostDataConverter || (JsonToPostDataConverter = {})));
    function map(data, callback) {
        if (typeof callback !== 'function') {
            throw new TypeError();
        }
        var arrayLength = data.length;
        var result = new Array(arrayLength);
        for (var i = 0; i < arrayLength; i++) {
            if (i in data) {
                result[i] = callback.call(undefined, data[i]);
            }
        }
        return result;
    }
    ;
    if (!Array.prototype.forEach) {
        Array.prototype.forEach = function (fn, scope) {
            for (var i = 0, len = this.length; i < len; ++i) {
                fn.call(scope, this[i], i, this);
            }
        };
    }
    return ajaxFile;
}));