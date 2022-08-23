import * as m from "mathjs"

export function clamp(v) {
	return m.min(m.max(v, 0), 1)
}

export function eigs(A) {
	try {
		const { values, vectors } = m.eigs(A)
		const tmp = m.transpose(vectors).valueOf()
		const evectors = m.matrix(
			m.transpose([
				m.divide(tmp[0], m.norm(tmp[0]) * (tmp[0][0] < 0 ? -1 : 1)),
				m.divide(tmp[1], m.norm(tmp[1]) * (tmp[1][1] < 0 ? -1 : 1)),
			])
		)
		return { values: values, vectors: evectors }
	} catch (e) {
		return {
			values: m.matrix([NaN, NaN]),
			vectors: m.matrix([
				[NaN, NaN],
				[NaN, NaN],
			]),
		}
	}
}

export function ease(time) {
	return (-m.cos(m.pi * time) + 1) / 2
}

export function normalize(v) {
	return m.divide(v, m.norm(v))
}

export function dist([x0, y0], [x1, y1]) {
	return m.sqrt((x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1))
}

export function eigenDecomposition(A) {
	const { values, vectors } = eigs(A)
	const Vec = vectors
	const L = m.matrix([
		[values.get([0]), 0],
		[0, values.get([1])],
	])
	return [Vec, L, m.inv(Vec)]
}

export function eigenAxisDecomposition(A) {
	const { values, vectors } = eigs(A)
	const Vec = vectors
	const L1 = m.matrix([
		[values.get([0]), 0],
		[0, 1],
	])
	const L2 = m.matrix([
		[1, 0],
		[0, values.get([1])],
	])
	return [m.multiply(Vec, L1, m.inv(Vec)), m.multiply(Vec, L2, m.inv(Vec))]
}

export function singularValueDecomposition(A) {
	const { values: uvalues, vectors: uvectors } = eigs(m.multiply(A, m.transpose(A)))
	const { vectors: vvectors } = eigs(m.multiply(m.transpose(A), A))

	const U = uvectors
	const S = m.matrix([
		[m.sqrt(uvalues.get([0])), 0],
		[0, m.sqrt(uvalues.get([1]))],
	])
	const Vt = m.transpose(vvectors)

	return [U, S, Vt]
}

export function schurDecomposition(A) {
	const { vectors } = eigs(A)
	const proj = m.dot([vectors.get([0, 0]), vectors.get([1, 0])], [0, 1])
	const q = m.matrix([
		[vectors.get([0, 0]), vectors.get([1, 0])],
		normalize([
			m.subtract(0, m.multiply(vectors.get([0, 0]), proj)),
			m.subtract(1, m.multiply(vectors.get([1, 0]), proj)),
		]),
	])
	return [q, m.multiply(m.transpose(q), A, q), m.transpose(q)]
}

export function interpolateAngle(A, time) {
	const t1 = time * m.atan2(A.get([1, 0]), A.get([0, 0]))
	const t2 = time * (m.atan2(A.get([1, 1]), A.get([0, 1])) - m.pi / 2) + m.pi / 2
	const s1 = time * (m.sqrt(m.square(A.get([0, 0])) + m.square(A.get([1, 0]))) - 1) + 1
	const s2 = time * (m.sqrt(m.square(A.get([0, 1])) + m.square(A.get([1, 1]))) - 1) + 1
	return m.matrix([
		[m.cos(t1) * s1, m.cos(t2) * s2],
		[m.sin(t1) * s1, m.sin(t2) * s2],
	])
}

export function interpolateEigen(A, time) {
	const { values, vectors } = eigs(A)
	const Vec = vectors
	const L1 = m.matrix([
		[time * (values.get([0]) - 1) + 1, 0],
		[0, time * (values.get([1]) - 1) + 1],
	])
	return m.multiply(Vec, L1, m.inv(Vec))
}
