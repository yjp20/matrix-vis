export function clamp(v) {
	return Math.min(Math.max(v, 0), 1)
}

export function ease(time) {
	return (-Math.cos(Math.PI * time) + 1) / 2
}

export function reduce(seq) {
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

export function scale(v, s) {
	return v.map((x) => x * s)
}

export function transform(A, [x, y]) {
	return [A[0][0] * x + A[0][1] * y, A[1][0] * x + A[1][1] * y]
}

export function eigen(A) {
	const v = A[0][0] + A[1][1]
	const evalues = [
		(v + Math.sqrt(v * v - 4 * (A[0][0] * A[1][1] - A[0][1] * A[1][0]))) / 2,
		(v - Math.sqrt(v * v - 4 * (A[0][0] * A[1][1] - A[0][1] * A[1][0]))) / 2,
	]

	const evectors = [
		normalize(
			nullv_1([
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

export function inverse(A) {
	const scale = 1 / (A[0][0] * A[1][1] - A[0][1] * A[1][0])
	return [
		[A[1][1] * scale, -A[0][1] * scale],
		[-A[1][0] * scale, A[0][0] * scale],
	]
}

export function transpose(A) {
	return [
		[A[0][0], A[1][0]],
		[A[0][1], A[1][1]],
	]
}

export function nullv_1(A) {
	// preferrentially assume x1 = 1
	if (A[1][1] != 0) return [1, -A[1][0] / A[1][1]]
	if (A[0][1] != 0) return [1, -A[0][0] / A[0][1]]
	if (A[0][0] != 0) return [-A[0][1] / A[0][0], 1]
	if (A[1][0] != 0) return [-A[1][1] / A[1][0], 1]
}

export function nullv_2(A) {
	// preferrentially assume x2 = 1
	if (A[0][0] != 0) return [-A[0][1] / A[0][0], 1]
	if (A[1][0] != 0) return [-A[1][1] / A[1][0], 1]
	if (A[1][1] != 0) return [1, -A[1][0] / A[1][1]]
	if (A[0][1] != 0) return [1, -A[0][0] / A[0][1]]
}

export function normalize(v) {
	const m = Math.sqrt(v[0] * v[0] + v[1] * v[1])
	return [v[0] / m, v[1] / m]
}

export function round(x) {
	return Math.floor(x * 100) / 100
}

export function dist([x0, y0], [x1, y1]) {
	return Math.sqrt((x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1))
}

export function eigenDecomposition(A) {
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

export function eigenAxisDecomposition(A) {
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

export function singularValueDecomposition(A) {
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

export function interpolateAngle(A, time) {
	const t1 = time * Math.atan2(A[1][0], A[0][0])
	const t2 = time * (Math.atan2(A[1][1], A[0][1]) - Math.PI / 2) + Math.PI / 2
	const s1 = time * (Math.sqrt(A[0][0] * A[0][0] + A[1][0] * A[1][0]) - 1) + 1
	const s2 = time * (Math.sqrt(A[0][1] * A[0][1] + A[1][1] * A[1][1]) - 1) + 1
	return [
		[Math.cos(t1) * s1, Math.cos(t2) * s2],
		[Math.sin(t1) * s1, Math.sin(t2) * s2],
	]
}

export function interpolateEigen(A, time) {
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
