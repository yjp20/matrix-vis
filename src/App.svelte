<script>
	import { onMount } from "svelte"

	const A = [
		[1, 0.4],
		[0.3, 1],
	]

	const V = [1, 0]

	let select = null
	let time = 1
	let canvas, ctx
	let width = window.innerWidth,
		height = window.innerHeight,
		spacing = 60

	let options = {
		eigen: false,
		draw: false,
		decomp: undefined,
	}

	function frame() {
		const [evalues, evectors] = eigen(A)
		console.log(options.decomp)
		let decomp = [A],
			interpolate = interpolateAngle,
			square = undefined
		if (options.decomp == "EIGEN") {
			decomp = eigenDecomposition(A)
			square = evectors
		}
		if (options.decomp == "EIGEN_AXIS") {
			decomp = eigenAxisDecomposition(A)
			interpolate = interpolateEigen
			square = evectors
		}
		if (options.decomp == "SINGULAR") {
			decomp = singularValueDecomposition(A)
			square = decomp[2]
		}
		const transform = reduce(
			decomp.map((mat, idx) => {
				const t = clamp(decomp.length * time - decomp.length + idx + 1)
				return interpolate(mat, ease(t))
			})
		)
		draw(transform, V, evalues, evectors, square)
		requestAnimationFrame(frame)
	}

	function draw(A, V, evalues, evectors, square) {
		if (ctx === undefined) return
		ctx.clearRect(0, 0, width, height)
		ctx.fillStyle = "black"
		ctx.rect(0, 0, width, height)
		ctx.fill()
		drawGrid()
		drawTransformGrid(A)
		drawBasis(A)
		if (square !== undefined) drawSquare(A, square)
		if (options.eigen) drawEig(evalues, evectors)
		if (options.draw) drawArrow(A, V)
	}

	function drawGrid() {
		for (
			let i = Math.floor(-width / spacing);
			i <= Math.ceil(width / spacing);
			i++
		) {
			const nx = Math.ceil(width / spacing)
			const lineColor = "#333"
			const lineWidth = i == 0 ? "2" : "1"
			drawLine(-nx, i, nx, i, lineColor, lineWidth)
			drawLine(i, -nx, i, nx, lineColor, lineWidth)
		}
	}

	function drawBasis(A) {
		drawPointTransform(A, [0, 1])
		drawPointTransform(A, [1, 0])
	}

	function drawTransformGrid(A) {
		for (
			let i = Math.floor(-width / spacing);
			i <= Math.ceil(width / spacing);
			i++
		) {
			const nx = Math.ceil(width / spacing)
			const lineColor = i == 0 ? "#fff" : "#09d"
			const lineWidth = i == 0 ? "2" : "1"
			drawLineTransform(A, [-nx, i], [nx, i], lineColor, lineWidth)
			drawLineTransform(A, [i, -nx], [i, nx], lineColor, lineWidth)
		}
	}

	function drawLineTransform(A, [x0, y0], [x1, y1], color, width) {
		const [x0p, y0p] = transform(A, [x0, y0])
		const [x1p, y1p] = transform(A, [x1, y1])
		drawLine(x0p, y0p, x1p, y1p, color, width)
	}

	function drawLine(x0, y0, x1, y1, color = "#000", stroke_width = 1) {
		ctx.lineWidth = stroke_width
		ctx.strokeStyle = color

		ctx.beginPath()
		moveTo(x0, y0)
		lineTo(x1, y1)
		ctx.stroke()
		ctx.closePath()
	}

	function drawPoint([x, y], radius) {
		ctx.beginPath()
		ctx.arc(
			x * spacing + width / 2,
			-y * spacing + height / 2,
			radius,
			0,
			2 * Math.PI
		)
		ctx.fill()
		ctx.closePath()
	}

	function drawPointTransform(A, [x, y], color = "white") {
		const [xt, yt] = transform(A, [x, y])
		ctx.fillStyle = color
		drawPoint([xt, yt], 5)
	}

	function drawEig(evalues, evectors) {
		ctx.beginPath()
		ctx.setLineDash([10, 10])
		drawLine(
			(-width / spacing) * evectors[0][0],
			(-width / spacing) * evectors[0][1],
			(+width / spacing) * evectors[0][0],
			(+width / spacing) * evectors[0][1],
			"turquoise",
			2
		)
		drawLine(
			(-width / spacing) * evectors[1][0],
			(-width / spacing) * evectors[1][1],
			(+width / spacing) * evectors[1][0],
			(+width / spacing) * evectors[1][1],
			"turquoise",
			2
		)
		ctx.stroke()
		ctx.closePath()
		ctx.setLineDash([])
	}

	function moveTo(x, y) {
		ctx.moveTo(x * spacing + width / 2, -y * spacing + height / 2)
	}

	function lineTo(x, y) {
		ctx.lineTo(x * spacing + width / 2, -y * spacing + height / 2)
	}

	function drawSquare(A, vectors) {
		const [a, b] = transform(A, vectors[0])
		const [c, d] = transform(A, vectors[1])

		ctx.fillStyle = "#0099dd83"
		ctx.beginPath()
		moveTo(0, 0)
		lineTo(a, b)
		lineTo(a + c, b + d)
		lineTo(c, d)
		lineTo(0, 0)
		ctx.fill()
		ctx.closePath()
	}

	function drawArrow(A, V) {
		const T = transform(A, [V[0], V[1]])
		drawLine(0, 0, V[0], V[1], "#FFE333", 5)
		drawLine(0, 0, T[0], T[1], "#F36F63", 5)
	}

	/* MATH UTILS */

	function clamp(v) {
		return Math.min(Math.max(v, 0), 1)
	}

	function ease(time) {
		return (-Math.cos(Math.PI * time) + 1) / 2
	}

	function reduce(seq) {
		return seq.reduce(
			(A, m) => [
				[
					A[0][0] * m[0][0] + A[0][1] * m[1][0],
					A[0][0] * m[0][1] + A[0][1] * m[1][1],
				],
				[
					A[1][0] * m[0][0] + A[1][1] * m[1][0],
					A[1][0] * m[0][1] + A[1][1] * m[1][1],
				],
			],
			[
				[1, 0],
				[0, 1],
			]
		)
	}

	function transform(A, [x, y]) {
		return [A[0][0] * x + A[0][1] * y, A[1][0] * x + A[1][1] * y]
	}

	function interpolateAngle(A, time) {
		const t1 = time * Math.atan2(A[1][0], A[0][0])
		const t2 = time * (Math.atan2(A[1][1], A[0][1]) - Math.PI / 2) + Math.PI / 2
		const s1 = time * (Math.sqrt(A[0][0] * A[0][0] + A[1][0] * A[1][0]) - 1) + 1
		const s2 = time * (Math.sqrt(A[0][1] * A[0][1] + A[1][1] * A[1][1]) - 1) + 1
		return [
			[Math.cos(t1) * s1, Math.cos(t2) * s2],
			[Math.sin(t1) * s1, Math.sin(t2) * s2],
		]
	}

	function interpolateEigen(A, time) {
		const [evalues, evectors] = eigen(A)
		const Vec = [
			[evectors[0][0], evectors[1][0]],
			[evectors[0][1], evectors[1][1]],
		]
		const L1 = [
			[time * (evalues[0] - 1) + 1, 0],
			[0, time * (evalues[1] - 1) + 1],
		]
		return reduce([Vec, L1, inverse(Vec)])
	}

	function eigen(A) {
		const v = A[0][0] + A[1][1]
		const evalues = [
			(v + Math.sqrt(v * v - 4 * (A[0][0] * A[1][1] - A[0][1] * A[1][0]))) / 2,
			(v - Math.sqrt(v * v - 4 * (A[0][0] * A[1][1] - A[0][1] * A[1][0]))) / 2,
		]

		const evectors = [
			normalize(
				nullv([
					[A[0][0] - evalues[0], A[0][1]],
					[A[1][0], A[1][1] - evalues[0]],
				])
			),
			normalize(
				nullv_2([
					[A[0][0] - evalues[1], A[0][1]],
					[A[1][0], A[1][1] - evalues[1]],
				])
			),
		]

		return [evalues, evectors]
	}

	function inverse(A) {
		const scale = 1 / (A[0][0] * A[1][1] - A[0][1] * A[1][0])
		return [
			[A[1][1] * scale, -A[0][1] * scale],
			[-A[1][0] * scale, A[0][0] * scale],
		]
	}

	function transpose(A) {
		return [
			[A[0][0], A[1][0]],
			[A[0][1], A[1][1]],
		]
	}

	function nullv(A) {
		// preferrentially assume x1 = 1
		if (A[1][1] != 0) return [1, -A[1][0] / A[1][1]]
		if (A[0][1] != 0) return [1, -A[0][0] / A[0][1]]
		if (A[0][0] != 0) return [-A[0][1] / A[0][0], 1]
		if (A[1][0] != 0) return [-A[1][1] / A[1][0], 1]
	}

	function nullv_2(A) {
		// preferrentially assume x2 = 1
		if (A[0][0] != 0) return [-A[0][1] / A[0][0], 1]
		if (A[1][0] != 0) return [-A[1][1] / A[1][0], 1]
		if (A[1][1] != 0) return [1, -A[1][0] / A[1][1]]
		if (A[0][1] != 0) return [1, -A[0][0] / A[0][1]]
	}

	function normalize(v) {
		const m = Math.sqrt(v[0] * v[0] + v[1] * v[1])
		return [v[0] / m, v[1] / m]
	}

	function round(x) {
		return Math.floor(x * 100) / 100
	}

	function dist([x0, y0], [x1, y1]) {
		return Math.sqrt((x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1))
	}

	function eigenDecomposition(A) {
		const [evalues, evectors] = eigen(A)
		const Vec = [
			[evectors[0][0], evectors[1][0]],
			[evectors[0][1], evectors[1][1]],
		]
		const L = [
			[evalues[0], 0],
			[0, evalues[1]],
		]
		return [Vec, L, inverse(Vec)]
	}

	function eigenAxisDecomposition(A) {
		const [evalues, evectors] = eigen(A)
		const Vec = transpose(evectors)
		const L1 = [
			[evalues[0], 0],
			[0, 1],
		]
		const L2 = [
			[1, 0],
			[0, evalues[1]],
		]
		return [reduce([Vec, L1, inverse(Vec)]), reduce([Vec, L2, inverse(Vec)])]
	}

	function singularValueDecomposition(A) {
		const [uvalues, uvectors] = eigen(reduce([A, transpose(A)]))
		const [vvalues, vvectors] = eigen(reduce([transpose(A), A]))

		const U = transpose(uvectors)
		const V = vvectors
		const S = [
			[Math.sqrt(uvalues[0]), 0],
			[0, Math.sqrt(uvalues[1])],
		]

		return [U, S, V]
	}

	/* HANDLERS */

	function getMousePos(e) {
		const x = (e.offsetX - width / 2) / spacing
		const y = -(e.offsetY - height / 2) / spacing
		return [x, y]
	}

	function onMouseDown(e) {
		const [x, y] = getMousePos(e)
		select = "ARROW"
		if (dist([x, y], transform(A, [1, 0])) <= 0.3) {
			select = "X"
		}
		if (dist([x, y], transform(A, [0, 1])) <= 0.3) {
			select = "Y"
		}
	}

	function onMouseUp(e) {
		select = null
	}

	function onMouseMove(e) {
		const [x, y] = getMousePos(e)
		if (select == "ARROW") {
			V[0] = x
			V[1] = y
		} else if (select == "X") {
			A[0][0] = x
			A[1][0] = y
		} else if (select == "Y") {
			A[0][1] = x
			A[1][1] = y
		}
	}

	onMount(() => {
		ctx = canvas.getContext("2d")
		canvas.addEventListener("mousedown", onMouseDown)
		canvas.addEventListener("mousemove", onMouseMove)
		canvas.addEventListener("mouseup", onMouseUp)
		frame()
	})

	$: [evalues, evectors] = eigen(A)
</script>

<svelte:window bind:innerHeight={height} bind:innerWidth={width} />

<div class="matrix-vis">
	<div class="options">
		<div class="block">
			<div class="eq">
				<div class="eq-var">A =</div>
				<div class="matrix">
					<div>
						<input
							type="number"
							step="0.01"
							value={round(A[0][0])}
							on:change={(e) => (A[0][0] = e.target.value)}
						/>
						<input
							type="number"
							step="0.01"
							value={round(A[0][1])}
							on:change={(e) => (A[0][1] = e.target.value)}
						/>
					</div>
					<div>
						<input
							type="number"
							step="0.01"
							value={round(A[1][0])}
							on:change={(e) => (A[1][0] = e.target.value)}
						/>
						<input
							type="number"
							step="0.01"
							value={round(A[1][1])}
							on:change={(e) => (A[1][1] = e.target.value)}
						/>
					</div>
				</div>
			</div>
		</div>

		<div class="block">
			<div class="header">
				<label>
					<input
						type="checkbox"
						id="draw"
						name="draw"
						bind:checked={options.draw}
					/> Show arrows
				</label>
			</div>

			{#if options.draw}
				<div class="eq" style="color: #FFE333">
					<div class="eq-var">V =</div>
					<div class="matrix">
						<div>
							<input type="number" bind:value={V[0]} />
						</div>
						<div>
							<input type="number" bind:value={V[1]} />
						</div>
					</div>
				</div>
				<div class="eq" style="color: #F36F63">
					<div class="eq-var">AV =</div>
					<div class="matrix">
						<div>
							<input
								type="number"
								readonly
								value={round(transform(A, [V[0], V[1]])[0])}
							/>
						</div>
						<div>
							<input
								type="number"
								readonly
								value={round(transform(A, [V[0], V[1]])[1])}
							/>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<div class="block">
			<div class="header">
				<label>
					<input
						type="checkbox"
						id="eigen"
						name="eigen"
						bind:checked={options.eigen}
					/> Show eigen
				</label>
			</div>

			{#if options.eigen}
				<div class="eq">
					<div class="eq-var">L1 =</div>
					<div>{round(evalues[0])}</div>
				</div>
				<div class="eq">
					<div class="eq-var">V1 =</div>
					<div class="matrix">
						<div>
							<input type="number" readonly value={round(evectors[0][0])} />
						</div>
						<div>
							<input type="number" readonly value={round(evectors[0][1])} />
						</div>
					</div>
				</div>
				<div class="eq">
					<div class="eq-var">L2 =</div>
					<div>{round(evalues[1])}</div>
				</div>
				<div class="eq">
					<div class="eq-var">V2 =</div>
					<div class="matrix">
						<div>
							<input type="number" readonly value={round(evectors[1][0])} />
						</div>
						<div>
							<input type="number" readonly value={round(evectors[1][1])} />
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<div class="animation-options">
		<div class="block">
			<div class="slidecontainer">
				<input
					type="range"
					min="0"
					max="1"
					step="0.01"
					bind:value={time}
					class="slider"
					id="myRange"
					list="steplist"
				/>
			</div>
			<div class="marks">
				{#if options.decomp == "EIGEN"}
					<div class="mark">V<sup>-1</sup></div>
					<div class="mark">L</div>
					<div class="mark">V</div>
				{/if}
				{#if options.decomp == "EIGEN_AXIS"}
					<div class="mark">V<sub>1</sub></div>
					<div class="mark">V<sub>2</sub></div>
				{/if}
				{#if options.decomp == "SINGULAR"}
					<div class="mark">V<sup>T</sup></div>
					<div class="mark">S</div>
					<div class="mark">U</div>
				{/if}
			</div>
			<select bind:value={options.decomp}>
				<option value={undefined}> No decomposition </option>
				<option value={"EIGEN"}> Eigendecomposition (diagonalization) </option>
				<option value={"EIGEN_AXIS"}> Eigenvector Axis decomposition </option>
				<option value={"SINGULAR"}> Singular Value decomposition </option>
			</select>
		</div>
	</div>

	<canvas bind:this={canvas} {height} {width} />
</div>

<style>
	:global(body) {
		background-color: black;
		padding: 0;
		margin: 0;
	}

	.matrix-vis {
		display: flex;
	}

	.matrix {
		position: relative;
		padding: 0.5em;
	}

	.matrix::before {
		position: absolute;
		box-sizing: border-box;
		left: 0;
		top: 0;
		height: calc(100% - 5px);
		width: 10px;
		content: " ";
		border-left: 2px solid currentColor;
		border-top: 2px solid currentColor;
		border-bottom: 2px solid currentColor;
	}

	.matrix::after {
		position: absolute;
		box-sizing: border-box;
		right: 0;
		top: 0;
		content: " ";
		height: calc(100% - 5px);
		width: 10px;
		border-right: 2px solid currentColor;
		border-top: 2px solid currentColor;
		border-bottom: 2px solid currentColor;
	}

	.block {
		padding: 0.5em;
	}

	.block + .block {
		border-top: 1px solid #333;
	}

	.eq {
		font-family: "Garamond", serif;
		display: flex;
		align-items: center;
		margin: 0.25em;
		margin-left: 0;
	}

	.eq-var {
		width: 5ch;
		margin-right: 1em;
		text-align: right;
	}

	.options {
		position: absolute;
		top: 1em;
		left: 1em;
	}

	.animation-options {
		position: absolute;
		bottom: 1em;
		width: 400px;
		left: 50%;
		margin-left: -200px;
	}

	.animation-options,
	.options {
		color: white;
		font-family: sans-serif;
		background-color: black;
		border: 2px solid #333;
		color: white;
	}

	input[type="number"]::-webkit-outer-spin-button,
	input[type="number"]::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	input[type="number"] {
		font: inherit;
		-moz-appearance: textfield;
		appearance: none;
		width: 4ch;
		border: 0;
		background: none;
		color: inherit;
		text-align: center;
		padding: 0;
	}

	input[type="range"] {
		width: 100%;
	}

	select {
		color: white;
		border: 2px solid #333;
		background-color: #111;
		width: 100%;
	}

	.header {
		font-family: sans-serif;
	}

	.marks {
		font-family: "Garamond", serif;
		display: flex;
		margin-bottom: 1em;
	}

	.mark {
		border-top: 2px solid #333;
		border-left: 2px solid #333;
		margin-right: 5px;
		flex: 1;
		padding-left: 0.25em;
	}
</style>
