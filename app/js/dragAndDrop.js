    var dragBody = `<div class="wrapper" id="wrapper">
    <div id="root"></div>
	<div class="wrapper__hide">
		<div id="hide-el">
		    <img src="chrome-extension://ieiahgfdghnojlimnmllmaemoekljpjo/app/icon/minimize.png" alt="">
		</div>
	</div>
	<div class="content">
		<div class="content__app-name">
			WhatsApp Bot
		</div>
		<form class="content__form">
			<div class="form__app-settings">
				<div class="app-settings__input-file">
					<div class="field">
						<div class="file is-primary">
							<label class="file-label">
								<input id="input-file" class="file-input" type="file" name="resume">
								<span class="file-cta">
                                            <span class="file-icon">
                                                <img src="chrome-extension://ieiahgfdghnojlimnmllmaemoekljpjo/app/icon/upload.png" alt="">
                                            </span>
                                            <span class="file-label">
                                                Primary file…
                                            </span>
                                            </span>
							</label>
						</div>
					</div>
				</div>
				<div class="app-settings__timeouts">
					<div class="field">
						<div class="control">
							<input class="input is-primary" id="timeout-input" type="number" min="15" placeholder="Timeout(default = 20 sec)">
						</div>
					</div>
				</div>
			</div>
			<textarea id="user-text" class="textarea" placeholder="Your template:" rows="10"></textarea>
			<div class="statistics">
				<div class="statistics__added">
					Was added: <span id="added">0</span>
				</div>
				<div class="statistics__lost">
					Remains to process: <span id="to-process">0</span>
				</div>
			</div>
			<div class="control button-start">
				<button id="start-sending-button" class="button is-primary">Start</button>
				<button id="pause-sending-button" class="button is-primary">Pause</button>
				<button id="stop-sending-button" class="button is-primary">Stop</button>
			</div>
		</form>
	</div>
</div>`;

    function randomInteger(min, max) {
        var rand = min - 0.5 + Math.random() * (max - min + 1)
        rand = Math.round(rand);
        return rand;
    }

    function handleFile(e) {
        var rABS = true;
        var data;
        $('#temp').remove();
        var files = e.target.files, f = files[0];
        var reader = new FileReader();
        reader.onload = function(e) {
            data = e.target.result;
            if(!rABS) data = new Uint8Array(data);
            var workbook = XLSX.read(data, {type: rABS ? 'binary' : 'array'});
            var worksheets = workbook.Sheets[workbook.SheetNames[0]];

            data = XLSX.utils.sheet_to_json(worksheets);

            var inputFields = Object.keys(data[0]);//all the field of file

            chrome.storage.local.set({'isSuspend':true});
            chrome.storage.local.set({'data':data});
            chrome.storage.local.set({'count':0});
            chrome.storage.local.set({'dataLength':data.length});

            var str ='';
            for(var i = 0; i < inputFields.length; i++){
                str+='<div class="input-data" style="float:left;margin-right:5px;margin-bottom:2px;background: #045B92;padding: 1px 3px 1px 3px;border-radius: 5px;">#{'+inputFields[i].trim()+'}</div>';
            }
            $('.form__app-settings').append('<div id="temp" style="height:80px;overflow-y:scroll;margin-bottom:10px">'+str+'</div>');
            $('#wrapper').css('height','470px');
        };
        if(rABS) reader.readAsBinaryString(f); else reader.readAsArrayBuffer(f);

    }

    function hideDropElement(){

        $('#hide-el').on('click',function () {
            if($('#wrapper').css('height') == '450px') {
                $('#wrapper').css('height', '24px');
                $('.content').css('display','none');
            }
            else if($('#wrapper').css('height') == '470px'){
                $('#wrapper').css('height', '24px');
                $('.content').css('display','none');
            }
            else if($('#wrapper').css('height') == '24px'){
                $('#wrapper').css('height', '470px');
                $('.content').css('display', 'flex');
            }
            else if($('#wrapper').css('height') == '24px' && $('#temp').length==0) {
                $('#wrapper').css('height', '450px');
                $('.content').css('display', 'flex');
            }
        });
    }

    function insertParsedData() {
        $('#wrapper').on('click','.input-data',function() {
            $('#user-text').val($('#user-text').val()+$(this).text());
        });
    }

    function createWorkTemplate(template,data,counter){
        var arr = template.split(' ');
        for(var i = 0; i < arr.length;i++){
            if(arr[i].indexOf('#{')!=-1){
                var temp = arr[i].substr(arr[i].indexOf('#{')+2,arr[i].indexOf('}')-2);
                arr[i] = arr[i].replace(/#{(.*)}/i,data[counter][temp]);
            }
        }
        return arr.join(" ");
    }

    function detectCurrentPage(){
        if($('#action-button').length != 0){
            return 1;
        }
        else if($('.compose-btn-send').length != 0 ){
            return 2
        }
        return 0;
    }

    function stopSending(e) {
        e.preventDefault();
        $('#added').text(0);
        $('#to-process').text(0);
        chrome.storage.local.set({'count':0});

        let promiseDetectStop = new Promise(function(resolve){
            chrome.storage.local.get('dataLength',function (r) {
                let dataLength = r.dataLength;
                resolve(dataLength);
            })
        });

        promiseDetectStop.then(function(resolve){
            chrome.storage.local.set({'count':resolve});
        });
    }

    function pauseWorking(e){
        e.preventDefault();
        let promiseGetSuspend = new Promise(function (resolve) {
           chrome.storage.local.get('isSuspend',function (r) {
               let isSuspend = r.isSuspend;
               resolve(isSuspend);
           })
        });

        promiseGetSuspend.then(function (resolve) {
            console.log(resolve);
            if(resolve == undefined){
                chrome.storage.local.set({'isSuspend':false});
            }
            else if(resolve){
                chrome.storage.local.set({'isSuspend':false});
                $('.compose-btn-send').click();
                $('#pause-sending-button').html('Continue');
            }
            else if(!resolve){
                chrome.storage.local.set({'isSuspend':true});
                $('#pause-sending-button').html('Pause');
                window.location.reload();
            }
        })
    }

    function parsePhoneNumber(number){
        number = number.replace(/\D+/g,'');
        return number;
    }

    function generateNextLink(number,template){
        var link = 'https://api.whatsapp.com/send?phone='+number+'&text='+template;
        return link;
    }






    ////////////////////////////////////////////////////


$(document).ready(function () {


    let getTimeout = new Promise(function (resolve) {
        chrome.storage.local.get('timeout',function (r) {
            let timeout = r.timeout;
            resolve(timeout);
        })
    });
    let getCount = new Promise(function (resolve) {
        chrome.storage.local.get('count',function (r) {
            let count = r.count;
            resolve(count);
        })
    });
    let getDataLength = new Promise(function (resolve) {
        chrome.storage.local.get('dataLength',function (r) {
            let dataLength = r.dataLength;
            resolve(dataLength);
        })
    });

    let getIsSuspendValue = new Promise(function (resolve) {
        chrome.storage.local.get('isSuspend',function (r) {
            let isSuspend = r.isSuspend;
            resolve(isSuspend);
        })
    })
    Promise.all([getTimeout,getCount,getDataLength,getIsSuspendValue]).then(function (values) {

    console.log('timeout '+values[0],'count '+values[1],'data.length '+values[2],'issuspend ' + values[3]);

        var checkPageTimeout = values[0]==0?20000:values[0];




        $('body').append(dragBody);

        $('#wrapper').draggable({
            containment:"body"
        });

        $('button#pause-sending-button').bind('click',pauseWorking);

        $('#input-file').bind('change',handleFile);

        $('button#stop-sending-button').bind('click',stopSending);

        $('#start-sending-button').on('click',function(e){
            var timeout = $('#timeout-input').val() == undefined ? 20000 : $('#timeout-input').val() * 1000;
            chrome.storage.local.set({'timeout':timeout});
            chrome.storage.local.set({'template':$('#user-text').val()})
        });

        insertParsedData();

        hideDropElement();

        $('#added').text(values[2]);
        $('#to-process').text(values[2]-values[1]);

        if(!values[3]){
            $('#pause-sending-button').html('Continue');
        }


    if(values[1] >= values[2]) {
        console.log('konec scripta');
        return 0;
    }
    setTimeout(function () {
            var pageName = detectCurrentPage();

            let promiseGetData = new Promise(function (resolve) {
                chrome.storage.local.get('data', function (r) {
                    let data = r.data;
                    resolve(data);
                })
            });

            let promiseGetTemplate = new Promise(function (resolve) {
                chrome.storage.local.get('template', function (r) {
                    let template = r.template;
                    resolve(template);
                })
            });

            let promiseGetCount = new Promise(function (resolve) {
                chrome.storage.local.get('count', function (r) {
                    let count = r.count;
                    resolve(count);
                })
            });

            let promiseIsSuspend = new Promise(function (resolve) {
                chrome.storage.local.get('isSuspend', function (r) {
                    let isSuspend = r.isSuspend;
                    resolve(isSuspend);
                })
            });

            Promise.all([promiseGetData, promiseGetTemplate, promiseGetCount, promiseIsSuspend]).then(function (values) {
                var data = values[0];
                var count = values[2];
                var template = values[1];
                var isSuspend = values[3];

                console.log(data);
                console.log(count);
                console.log(template);

                if (!isSuspend)
                    return 0;

                if (count < data.length) {
                    template = createWorkTemplate(template, data, count);//creating template with necessary data
                    var number = parsePhoneNumber(data[count]['Phone']);
                    var nextLink = generateNextLink(number, template);
                    console.log(nextLink);
                }
                else {
                    template = 'All messages sent';
                    number = 'All messages sent';
                    nextLink = 'All messages sent';
                }


                if (pageName == 0) {
                    console.log('here 1st page');
                    if (count < data.length) {
                        window.location.href = nextLink;
                    }
                    else {
                        return 0;
                    }
                }
                else if (pageName == 1) {
                    console.log('here 2nd page');
                    let changeCountPromise = new Promise(function (resolve) {
                        chrome.storage.local.get('count', function (r) {
                            let count = r.count;
                            console.log('v promise');
                            resolve(count);
                        })
                    });

                    changeCountPromise.then(function (resolve) {
                        chrome.storage.local.set({'count': resolve + 1});
                        console.log('then posle promisa');
                        $('#action-button')[0].click();
                        $('#action-button')[0].click();
                        $('#action-button')[0].click();
                        setTimeout(function () {
                            window.location.reload();
                        },10000)
                    });

                }
                else if (pageName == 2) {
                    console.log('here 3d page');
                    if (count < data.length) {
                        $('.compose-btn-send').click();
                        setTimeout(function () {
                            window.location.href = nextLink;
                        },1500);

                    }
                    else if (count == data.length-1) {
                        $('.compose-btn-send').click();
                    }
                }
            });


        }, checkPageTimeout);



    });

});