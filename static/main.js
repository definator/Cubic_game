(function(){
	const prevRecords = JSON.parse(localStorage.getItem('records'));
	const gameField = document.querySelector('div#game');
	const startBtn = document.querySelector('button#start_game');
	const newGameBtn = document.querySelector('button#new_game');
	const pointsCntr = document.querySelector('span#points');
	const timeLeftCntr = document.querySelector('span#time_left');
	const recordTable = document.querySelector('div#prev_records');
	const modalDiv = document.querySelector('div#modal');
	const finalScore = document.querySelector('span#final_score');
	const modal = new bootstrap.Modal(modalDiv,{keyboard:false});
	const saveRecord = modalDiv.querySelector('button#save_record');
	const errorMsg = document.querySelector('div.error');
	const cellSize = 60;
	const total_time = 60;
	const maxAmount = 30;
	const minAmount = 23;
	const dangerColor = '#f00';
	const successColor = '#0f0';
	let gameObj,timerId, total_points = 0,

	allCubes = [['base', 'double', 'triple'],
						['question', 'quadruple'],
						['timeadd', 'quintuple']];


	let ACTIONS = {
		disappear: el => {
			el.parentNode.classList.add('not-active');
			el.style.opacity = '.1';
			el.addEventListener('transitionend', (e) => {
				e.target.remove();
			});
			gameObj.setCurrentAmount(-1);
		},
		changePointsCounter: points => {
			if(!points)
				total_points = 0;
			else{
				total_points += points;
				pointsCntr.innerText = total_points;
				finalScore.innerText = total_points;
			}
			
		},
		incORdec: () => {
			let x = 5;
			let random_number = getRandomInt(1,10);
			if(random_number < x)
				x*=-1

			gameObj.changeTime(x);
		},
		increaseTime: () => {
			gameObj.changeTime(5);
		},
	};

	let CUBE_INFO = {
		base: {
			size: 40,
			points: 1,
			actions: []
		},
		double: {
			size: 30,
			points: 2,
			actions: []
		},
		triple: {
			size: 25,
			points: 3,
			actions: []
		},
		question: {
			size: 40,
			points: '?',
			actions: ['incORdec']
		},
		quadruple: {
			size: 20,
			points: 4,
			actions: []
		},
		quintuple: {
			size: 20,
			points: 5,
			actions: []
		},
		timeadd: {
			size: 20,
			points: '♥',
			actions: ['increaseTime']
		},
	};

	const getRandomInt = (min, max) => {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	};
	const addRecord = (name, points) => {
		
		let newData = {
			name: name,
			points: points
		};
		fetch('/results', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(newData)
		})
		.then(response => response.text())
		.then(data => initRecordTable(data));
	};
	const showError = err => {
		errorMsg.innerText = err;
	};
	const showRecords = () => {
		fetch('/results')
		.then(response => response.text())
		.then(data => initRecordTable(data));
	};
	const initRecordTable = data => {
		let records;
		//Проверяем является ли ответ сервера JSON форматом
		try {
			records = JSON.parse(data);
			
		} catch(e) {
			showError(data);
			return;
		}
		errorMsg.innerText = '';
		modal.hide();
		recordTable.innerHTML = '';
		//сортируем очки по убыванию
		if(records.length >= 2)
			records = records.sort((a, b) => b.points - a.points);
		////////////////////////////
		records.forEach(item => {
			let record = document.createElement('div');
			let name = document.createElement('span');
			let points = document.createElement('span');
			name.innerText = item.name + ': ';
			points.innerText = item.points;
			recordTable.appendChild(record);
			record.appendChild(name);
			record.appendChild(points);
		});
	};
	const playSound = (filename) => {
		let audio = new Audio();
		audio.preload = 'auto';
		audio.src = './audio/'+filename+'.mp3';
		audio.play();
	};
	if(prevRecords)
		showRecords(prevRecords);


	class Game {
		constructor() {
			this.currentTimer = total_time;
			this.difficulty = 0;
			total_points = 0;
			this.maxAmount = maxAmount;
			this.minAmount = minAmount;
			this.availableCubes = allCubes[0];
			this.currentAmount = 0;
			this.missclicks = 0;
		}

		setTimer(dur) {

////////////////turn off previous timer if exists
			if(timerId)
				clearTimeout(timerId);
////////////////////////////////////
			
			this.currentTimer = dur;
			timerId = setTimeout(function clock(){
				if(gameObj.currentTimer > 0){

					timeLeftCntr.innerText = gameObj.currentTimer;

					gameObj.changeDifficulty(gameObj.currentTimer);
					
					gameObj.currentTimer--;
				}
				else{
					timeLeftCntr.innerText = 0;
					clearTimeout(timerId);
					modal.show();
					gameObj.stop();
					return;
				}
				timerId = setTimeout(clock, 1000);
			},0);
			

		}
		setCurrentAmount(number) {
			gameObj.currentAmount += number;
		};
		generateNewCube() {
			let name = this.availableCubes[getRandomInt(0, this.availableCubes.length-1)];
			let size = CUBE_INFO[name].size;
			let text = CUBE_INFO[name].points;
			let x = getRandomInt(0, cellSize - size);
			let y = getRandomInt(0, cellSize - size);
			let newCube = {
				size: size,
				name: name,
				x: x,
				y: y,
				text: text
			};

			return newCube;
		}
		addCube(cell) {
			const newCube = this.generateNewCube();
			let cube = document.createElement('div');
			cube.className = newCube.name+'-cube';
			cell.classList.remove('not-active');
			cube.style.top = newCube.y+'px';
			cube.style.left = newCube.x+'px';
			cube.style.lineHeight = newCube.size+'px';
			cube.innerText = newCube.text;
			this.setCurrentAmount(1);
			cell.appendChild(cube);

//////////// animate appearance
			setTimeout(function(){
				cube.style.height = newCube.size+'px';
				cube.style.width = newCube.size+'px';
				cube.style.fontSize = '18px';
				}, 0);
			this.initCubes();
		}
		createGrid() {
			let arr = [];
			for(let i = 0; i < 136; i++){

				let cell = document.createElement('div');
				cell.className = 'cell not-active';
				gameField.appendChild(cell);
				arr.push(cell);

			}
			return arr;
		}
		initCubes() {
			let emptyCells = gameField.querySelectorAll('.cell.not-active');
			if(!emptyCells.length)
				emptyCells = this.createGrid();
			
			const x = getRandomInt(0, emptyCells.length-1);
			if(emptyCells.length + maxAmount > 136)
				this.addCube(emptyCells[x]);
			else
				return;



		}
		signal(color) {
			gameField.style.backgroundColor = color;
			setTimeout(() => {
				gameField.style.backgroundColor = '#353c42';
			}, 50);

		}
		changeDifficulty(dur) {

			if((!this.difficulty && dur <= 40) ||
				(this.difficulty === 1 && dur <= 20))
			{
				this.difficulty++;
				this.availableCubes = this.availableCubes.concat(allCubes[this.difficulty]);
			}

		}
		changeTime(time) {

			let newTimer = this.currentTimer + time;

			if(time < 0){
				this.signal(dangerColor);
				playSound('bad');
			}
			else{
				this.signal(successColor);
				playSound('good');
			}
				this.setTimer(newTimer);
		}
		checkMissclicks() {
			if(this.missclicks < 4)
				this.missclicks++;
			else{
				this.missclicks = 0;
				this.changeTime(-10);
			}
		}
		resetPoints() {
			this.points = 0;
			pointsCntr.innerText = '0';

		}
		clearField() {
			let blocks = document.querySelectorAll('[class$="-cube"]');
			this.currentAmount = 0;
			blocks.forEach(item => {
				item.parentNode.classList.add('not-active');
				item.remove();
			});
		}
		start() {
			this.setTimer(this.currentTimer);
			this.initCubes();
		}
		stop() {
			this.clearField();
			this.resetPoints();
			gameObj = null;
			startBtn.disabled = false;
		}
		restart() {
			this.currentTimer = total_time;
			this.clearField();
			this.resetPoints();
			total_points = 0;
			this.start();
		}
	}


	startBtn.addEventListener('click', ()=>{
		gameObj = new Game();
		gameObj.start();
		startBtn.disabled = true;
	});

	newGameBtn.addEventListener('click', ()=>{
		if(!gameObj)
			gameObj = new Game();
		gameObj.restart();
	});


	gameField.addEventListener('mousedown', e => {
///////check if the game is started and is there a missclick
		if(e.target.className.indexOf('-cube') < 0 && gameObj){
			gameObj.checkMissclicks();

			return;
		}
		else if(!gameObj)
			return;
////////////////////////////////////////////////////////
//////////////////////////
		
		if(gameObj.currentAmount <= minAmount)
			gameObj.initCubes();
		playSound('usual');
		let cube_name = e.target.className.split('-')[0];
		let cube_actions = CUBE_INFO[cube_name].actions;
		let cube_points = CUBE_INFO[cube_name].points;
		ACTIONS.disappear(e.target);
		if(typeof cube_points === 'number')
			ACTIONS.changePointsCounter(cube_points);

		if(!cube_actions) return;

		cube_actions.forEach(action => {
			ACTIONS[action]();
		})
	});

	saveRecord.addEventListener('click', () => {
		const username = modalDiv.querySelector('input#username');
		if(!username.value){
			username.style.border = '1px solid red';
			return;
		}
		addRecord(username.value, total_points);
		
		
	});
	recordTable.addEventListener('dblclick', () => {
		fetch('/results',{
		method: 'POST',
		body: 'cleanRecords'
		})
		.then(response => {
			showRecords();
		});
	});
})();