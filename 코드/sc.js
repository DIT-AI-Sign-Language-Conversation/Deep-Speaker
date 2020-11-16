let video;
// KNN classifier 생성
const knnClassifier = ml5.KNNClassifier();
let poseNet;
let poses = [];

//
var no = 1;
var tag = new Array();

var estimation = new Array(); // 판단 배열
var count = 0;
var main = new Array();
var maincount = 0;
var lll = false;

var audio_area = new Audio('area.mp3');

//
var textLineIn = document.getElementById('textarea');

// tts 이벤트 영역
const text = document.getElementById("text")

// 배열 비율 비교
function mode(arr){
  return arr.sort((a,b) =>
        arr.filter(v => v===a).length
      - arr.filter(v => v===b).length
  ).pop();
}

function speak(text, opt_prop) {
  if (typeof SpeechSynthesisUtterance === "undefined" || typeof window.speechSynthesis === "undefined") {
      alert("이 브라우저는 음성 합성을 지원하지 않습니다.")
      return
  }

  window.speechSynthesis.cancel() // 현재 읽고있다면 초기화

  const prop = opt_prop || {}

  const speechMsg = new SpeechSynthesisUtterance()

  speechMsg.rate = prop.rate || 1 // 속도: 0.1 ~ 10
  speechMsg.pitch = prop.pitch || 1 // 음높이: 0 ~ 2
  speechMsg.lang = prop.lang || "ko-KR"//
  speechMsg.text = textLineIn.value

  // SpeechSynthesisUtterance에 저장된 내용을 바탕으로 음성합성 실행
  window.speechSynthesis.speak(speechMsg)

}

function setup() {
  const canvas = createCanvas(400, 300);
  canvas.parent('videoContainer');
  video = createCapture(VIDEO);
  video.size(width, height);

  // Create the UI buttons
  createButtons();

  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(video, modelReady);

  // 위에서 생성한 "poses"를 채우는 이벤트 설정
  // 새로운 포즈가 감지 될 때 마다 배열 재정립
  poseNet.on('pose', function(results) {
    poses = results;
  });
  // Hide the video element, and just show the canvas
  video.hide();
}

function draw() {
  image(video, 0, 0, width, height);

  // We can call both functions to draw all keypoints and the skeletons
  drawKeypoints();
  drawSkeleton();
}

function modelReady(){
  select('#status').html('model Loaded')
}

// Predict the current frame.
function classify() {
  // Get the total number of labels from knnClassifier
  const numLabels = knnClassifier.getNumLabels();
  if (numLabels <= 0) {
    console.error('There is no examples in any label');
    return;
  }
  // Convert poses results to a 2d array [[score0, x0, y0],...,[score16, x16, y16]]
  const poseArray = poses[0].pose.keypoints.map(p => [p.score, p.position.x, p.position.y]);

  // Use knnClassifier to classify which label do these features belong to
  // You can pass in a callback function `gotResults` to knnClassifier.classify function
  knnClassifier.classify(poseArray, gotResults);
}

// A util function to create UI buttons
function createButtons() {
  // Predict button
  buttonPredict = select('#buttonPredict');
  buttonPredict.mousePressed(classify);
}

// Show the results
function gotResults(err, result) {

  // Display any error
  if (err) {
    console.error(err);
  }

  if (result.confidencesByLabel) {
    const confidences = result.confidencesByLabel;
      var obKey = Object.keys(confidences);
    // result.label is the label that has the highest confidence
    let l = Object.keys(confidences).length
    console.log(l);
    if (true) {
      // for(var j = 0; j < l; j++){
      //   const confidences_key = obKey[j];
      //   const confidences_value = confidences[obKey[j]];
      //     // select('#result').html(confidences_key);
      //     // select('#confidence').html(`${confidences_value * 100} %`);
      // }
      for(var i = 0; i<obKey.length; i++){
        if(confidences[obKey[i]] == 1){
          select('#result').html(obKey[i]);
          select('#confidence').html(`${confidences[obKey[i]] * 100} %`);

          if(confidences[obKey[0]] == 1 && maincount == 0 && count == 0){
            main[maincount] = " ";
            textLineIn.innerHTML += main[maincount];
            maincount ++;
            count = 0;
          }else if(maincount != 0){

            //여기서부터 main에 들어갈 배열의 판단이 시작됨
            if(estimation.length < 30){
              estimation[count] = obKey[i];
              count++;
            }else if (estimation.length == 30) {
              console.log('---------mode :' + mode(estimation) + '---------');
              console.log("main: " + main + "///" + "maincount: " + maincount + "///" + "lll: " + lll + "///" + "count: " + count);
              for(var p = 0; p < main.length; p++){ //메인 배열안에 중복을 넣지 않기 위함 lll을  true로 줘서 들어갈지 안들어갈지 확인함
                if(main[p] == mode(estimation)){
                  lll = true;
                }
              }

              //main 배열에 넣을 준비
              if(lll == false){
                if(mode(estimation) == "동작없음" && main.length != 0){
                  audio_area.play();
                  f2(3)
                  f3(4);
                  f(20);
                  f1(15);
                  console.log("너! 동기식에 성공했구나!");
                }else{
                  main[maincount] = mode(estimation);
                  textLineIn.innerHTML += " " + main[maincount];
                  maincount ++;
                  estimationReset();
                }
              }else{
                lll = false;
                estimationReset();
              }

            }
          }
        }
      }
    }
  }
  classify();
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints()  {
  image(video, 0, 0, width, height);
  strokeWeight(7);
  // For one pose only (use a for loop for multiple poses!)
  if (poses.length > 0) {
    let pose = poses[0].pose;
    for (let i = 0; i < pose.keypoints.length; i++) {
      fill(213, 0, 0);
      noStroke();
      ellipse(pose.keypoints[i].position.x, pose.keypoints[i].position.y, 8);
    }
  }
}

// A function to draw the skeletons
function drawSkeleton() {
  // Loop through all the skeletons detected
  for (let i = 0; i < poses.length; i++) {
    let skeleton = poses[0].skeleton;
    // For every skeleton, loop through all body connections
    for (let j = 0; j < skeleton.length; j++) {
      let partA = skeleton[j][0];
      let partB = skeleton[j][1];
      stroke(255, 0, 0);
      line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
    }
  }
}


var file = document.querySelector('#getfile');

file.onchange = function () {
    var fileList = file.files ;

    // 읽기
    var reader = new FileReader();
    reader.readAsText(fileList [0]);

    //로드 한 후
    reader.onload = function  () {
      var obj = JSON.parse(reader.result);
        loadMyKNN(obj);
        updateCounts();
    };
};

function loadMyKNN(aa) {
    // var myObj = JSON.parse("./myKNNDataset.json");
    // var mydata = JSON.parse(dataset);
    knnClassifier.load(aa, updateCounts);
}

function updateCounts() {
  const counts = knnClassifier.getCountByLabel();

  for(var i = 1; i<=no;i++){
    counts[''+tag[i]] || 0;
  }

}

//모두 초기화
function allReset(){
  main = [];
  maincount = 0;
  estimation = [];
  count = 0;
}
//판단 초기화
function estimationReset(){
  estimation = [];
  count = 0;
}

function speakOut(){
  speak(textLineIn.innerText, {
      rate: 1,
      pitch: 1.2,
      lang: "ko-KR"
  })
}

/////////////// 동기식으로 실행하기

function f3(n) {// 마이크 온
    return new Promise((r1, r2) => {
        setTimeout(() => {
        console.log("비동기냐?");
        console.log("지우겠다!");
        allReset();
        startButton(event);
        console.log("마이크on!");
        }, 1000 * n);
        r1();
    })
}

function f2(n) {// 마이크 오프
    return new Promise((r1, r2) => {
        setTimeout(() => {
        speakOut();
        }, 1000 * n);
        r1();
    })
}

function f(n) {// 마이크 오프
    return new Promise((r1, r2) => {
        setTimeout(() => {
        startButton(event);
        console.log("마이크off!");
        }, 1000 * n);
        r1();
    })
}

function f1(n) {
    return new Promise((r1, r2) => {
        setTimeout(() => {
        textLineIn.innerHTML = "";
        }, 1000 * n);
        r1();
    })
}

// stt
var final_transcript = '';
        var recognizing = false;
        var ignore_onend;
        var start_timestamp;
        var search_input = document.getElementById('textareaOut'); // 자신의 검색 상자 태그ID를 여기에 넣습니다.
        var search_Button = document.getElementById('speech_img');

        // Browser Upgrade or Not supported Browser
        if (!('webkitSpeechRecognition' in window)) {
            upgrade();
        } else {
            start_button.style.display = 'inline-block';
            var recognition = new webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;

            recognition.onstart = function() {
                recognizing = true;
                start_img.src = './images/mic-animate.gif';
            };

            recognition.onerror = function(event) {
                if (event.error == 'no-speech') {
                    start_img.src = './images/mic.gif';
                    ignore_onend = true;
                }
                if (event.error == 'audio-capture') {
                    start_img.src = './images/mic.gif';
                    ignore_onend = true;
                }
                if (event.error == 'not-allowed') {
                    ignore_onend = true;
                }
            };

            recognition.onend = function() {
                recognizing = false;
                if (ignore_onend) {
                    return;
                }
                start_img.src = './images/mic.gif';
                if (!final_transcript) {
                    return;
                }
                if (window.getSelection) {
                    window.getSelection().removeAllRanges();
                    var range = document.createRange();
                    range.selectNode(search_input);
                    window.getSelection().addRange(range);
                }
            };

            recognition.onresult = function(event) {
                var interim_transcript = '';
                for (var i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        final_transcript += event.results[i][0].transcript;
                    } else {
                        interim_transcript += event.results[i][0].transcript;
                    }
                }
                final_transcript = capitalize(final_transcript);
                search_input.value = linebreak(final_transcript);
            };
        }

        function searchVisible() {
            if(search_Button.style.display != 'inline-block') {
                search_Button.style.display = 'inline-block';
            } else {
                speech_Button.style.display = 'none';
            }
        }

        function searchHidden() {
            if(search_Button.style.display != 'none') {
                search_Button.style.display = 'none';
            }
        }

        function upgrade() {
            start_button.style.visibility = 'hidden';
        }

        var two_line = /\n\n/g;
        var one_line = /\n/g;

        function linebreak(s) {
            return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
        }

        var first_char = /\S/;

        function capitalize(s) {
            return s.replace(first_char, function(m) { return m.toUpperCase(); });
        }

        function startButton(event) {
            if (recognizing) {
                recognition.stop();
                return;
            }

            final_transcript = '';
            recognition.lang = 'ko-KR';
            recognition.start();
            ignore_onend = false;
            search_input.value = '';
            start_img.src = './images/mic-slash.gif';
            start_timestamp = event.timeStamp;
        }
// ! stt
