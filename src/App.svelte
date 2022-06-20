<script>
	import { onMount } from "svelte"
	import Matrix from "./Matrix.svelte"
	import {
		clamp,
		ease,
		reduce,
		scale,
		transform,
		eigen,
		transpose,
		round,
		dist,
		eigenDecomposition,
		eigenAxisDecomposition,
		singularValueDecomposition,
		schurDecomposition,
		interpolateAngle,
		interpolateEigen,
	} from "./linalg.js"

	let A = [
		[1, 0.6],
		[0.3, 1],
	]
	let V = [1, 0]

	let select = null
	let time = 1
	let canvas, ctx
	let width = window.innerWidth,
		height = window.innerHeight,
		spacing = 60

	let options = {
		eigen: false,
		draw: false,
		transpose: false,
		decomp: undefined,
	}

	function frame() {
		const [evalues, evectors] = eigen(A)
		let decomp = [A],
			interpolate = interpolateAngle,
			square = undefined
		if (options.decomp == "EIGEN") {
			decomp = eigenDecomposition(A)
			square = evectors
		}
		if (options.decomp == "SCHUR") {
			decomp = schurDecomposition(A)
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
		if (options.transpose) drawTransformGrid(transpose(A), "red")
		if (options.draw) drawArrowPair(A, V)
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
			drawLine([-nx, i], [nx, i], lineColor, lineWidth)
			drawLine([i, -nx], [i, nx], lineColor, lineWidth)
		}
	}

	function drawBasis(A) {
		drawPointTransform(A, [0, 1])
		drawPointTransform(A, [1, 0])
	}

	function drawTransformGrid(A, color = "#09d") {
		for (
			let i = Math.floor(-width / spacing);
			i <= Math.ceil(width / spacing);
			i++
		) {
			const nx = Math.ceil(width / spacing)
			const lineColor = i == 0 ? "#fff" : color
			const lineWidth = i == 0 ? "2" : "1"
			drawLineTransform(A, [-nx, i], [nx, i], lineColor, lineWidth)
			drawLineTransform(A, [i, -nx], [i, nx], lineColor, lineWidth)
		}
	}

	function drawLineTransform(A, [x0, y0], [x1, y1], color, width) {
		const [x0p, y0p] = transform(A, [x0, y0])
		const [x1p, y1p] = transform(A, [x1, y1])
		drawLine([x0p, y0p], [x1p, y1p], color, width)
	}

	function drawArrow([x0, y0], [x1, y1], color, width = 5) {
		drawLine([x0, y0], [x1, y1], color, width)

		const angle = Math.atan2(y1 - y0, x1 - x0)
		const ANGLE_OFFSET = 0.7
		const HEAD_LENGTH = 0.15

		ctx.lineWidth = width
		ctx.strokeStyle = color

		ctx.beginPath()
		moveTo(
			x1 - HEAD_LENGTH * Math.cos(angle + ANGLE_OFFSET),
			y1 - HEAD_LENGTH * Math.sin(angle + ANGLE_OFFSET)
		)
		lineTo(x1, y1)
		lineTo(
			x1 - HEAD_LENGTH * Math.cos(angle - ANGLE_OFFSET),
			y1 - HEAD_LENGTH * Math.sin(angle - ANGLE_OFFSET)
		)
		ctx.stroke()
		ctx.closePath()
	}

	function drawLine([x0, y0], [x1, y1], color = "#000", stroke_width = 1) {
		ctx.lineWidth = stroke_width
		ctx.strokeStyle = color

		ctx.beginPath()
		moveTo(x0, y0)
		lineTo(x1, y1)
		ctx.stroke()
		ctx.closePath()
	}

	function drawPoint([x, y], radius, color = "white") {
		ctx.fillStyle = color
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
		drawPoint([xt, yt], 5, color)
	}

	function drawEig(evalues, evectors) {
		ctx.setLineDash([10, 3])
		drawLine(
			[
				(-width / spacing) * evectors[0][0],
				(-width / spacing) * evectors[0][1],
			],
			[
				(+width / spacing) * evectors[0][0],
				(+width / spacing) * evectors[0][1],
			],
			"turquoise",
			2
		)
		drawLine(
			[
				(-width / spacing) * evectors[1][0],
				(-width / spacing) * evectors[1][1],
			],
			[
				(+width / spacing) * evectors[1][0],
				(+width / spacing) * evectors[1][1],
			],
			"turquoise",
			2
		)
		ctx.setLineDash([])
		drawPoint(evectors[0], 3, "turquoise")
		drawPoint(evectors[1], 3, "turquoise")
		drawArrow(evectors[0], scale(evectors[0], evalues[0]), "turquoise", 2)
		drawArrow(evectors[1], scale(evectors[1], evalues[1]), "turquoise", 2)
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

	function drawArrowPair(A, V) {
		const T = transform(A, [V[0], V[1]])
		drawArrow([0, 0], V, "#FFE333", 2)
		drawArrow([0, 0], T, "#F36F63", 2)
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
			<div class="label">OPTIONS</div>
			<div class="eq">
				<div class="eq-var">A =</div>
				<Matrix bind:matrix={A} />
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
					<Matrix bind:matrix={V} />
				</div>
				<div class="eq" style="color: #F36F63">
					<div class="eq-var">AV =</div>
					<Matrix matrix={transform(A, V)} readonly />
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
						bind:checked={options.transpose}
					/> Show transpose
				</label>
			</div>
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
					<Matrix matrix={evectors[0]} readonly />
				</div>
				<div class="eq">
					<div class="eq-var">L2 =</div>
					<div>{round(evalues[1])}</div>
				</div>
				<div class="eq">
					<div class="eq-var">V2 =</div>
					<Matrix matrix={evectors[1]} readonly />
				</div>
			{/if}
		</div>
	</div>

	<div class="animation-options">
		<div class="block">
			<div class="label">ANIMATION</div>
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
				{#if options.decomp == undefined}
					<div class="mark">
						<span>A =</span>
						<Matrix matrix={A} readonly />
					</div>
				{/if}
				{#if options.decomp == "EIGEN"}
					<div class="mark">
						<span>V =</span>
						<Matrix matrix={eigenDecomposition(A)[0]} readonly />
					</div>
					<div class="mark">
						<span>Λ =</span>
						<Matrix matrix={eigenDecomposition(A)[1]} readonly />
					</div>
					<div class="mark">
						<span>V<sup>-1</sup> =</span>
						<Matrix matrix={eigenDecomposition(A)[2]} readonly />
					</div>
				{/if}
				{#if options.decomp == "EIGEN_AXIS"}
					<div class="mark">
						<span>V<sub>1</sub> =</span>
						<Matrix matrix={eigenAxisDecomposition(A)[0]} readonly />
					</div>
					<div class="mark">
						<span>V<sub>2</sub> =</span>
						<Matrix matrix={eigenAxisDecomposition(A)[1]} readonly />
					</div>
				{/if}
				{#if options.decomp == "SCHUR"}
					<div class="mark">
						<span>U =</span>
						<Matrix matrix={schurDecomposition(A)[0]} readonly />
					</div>
					<div class="mark">
						<span>T =</span>
						<Matrix matrix={schurDecomposition(A)[1]} readonly />
					</div>
					<div class="mark">
						<span>U<sup>T</sup> =</span>
						<Matrix matrix={schurDecomposition(A)[2]} readonly />
					</div>
				{/if}
				{#if options.decomp == "SINGULAR"}
					<div class="mark">
						<span>U =</span>
						<Matrix matrix={singularValueDecomposition(A)[0]} readonly />
					</div>
					<div class="mark">
						<span>S =</span>
						<Matrix matrix={singularValueDecomposition(A)[1]} readonly />
					</div>
					<div class="mark">
						<span>V<sup>T</sup> =</span>
						<Matrix matrix={singularValueDecomposition(A)[2]} readonly />
					</div>
				{/if}
			</div>
		</div>
		<div class="block">
			<div class="label">DECOMPOSITION</div>
			<select bind:value={options.decomp}>
				<option value={undefined}> No decomposition </option>
				<option value={"EIGEN"}> Eigendecomposition (diagonalization) </option>
				<option value={"EIGEN_AXIS"}> Eigenvector Axis decomposition </option>
				<option value={"SCHUR"}> Schur decomposition </option>
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

	.label {
		font-weight: bold;
		font-size: 0.75em;
		margin-bottom: 8px;
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
		width: 450px;
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

	:global(input[type="number"]::-webkit-outer-spin-button),
	:global(input[type="number"]::-webkit-inner-spin-button) {
		-webkit-appearance: none;
		margin: 0;
	}

	:global(input[type="number"]) {
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
		direction: rtl;
		width: 100%;
		box-sizing: border-box;
		margin: 0;
	}

	select {
		color: white;
		font-size: 1.1em;
		border: 2px solid #333;
		padding: 0.125rem;
		background-color: #111;
		width: 100%;
	}

	.header {
		font-family: sans-serif;
	}

	.marks {
		font-family: "Garamond", serif;
		display: flex;
		margin-top: 1em;
	}

	.mark {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.25rem;
		flex: 1;
	}

	.mark + .mark {
		margin-left: 0.5rem;
	}

	.mark::before{
		position: absolute;
		top: -16px;
		left:0;
		right: 0;
		content: " ";
		height: 8px;
		border-radius: 0 0 8px 8px;
		border-bottom: 3px solid white;
	}

	.mark > span {
		margin-right: 0.25em;
	}
</style>
