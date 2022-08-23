<script>
	import { typeOf, round } from "mathjs"
	export let matrix
	export let readonly = false

	$: array = matrix.valueOf()
</script>

<div class="matrix">
	{#if Array.isArray(array[0])}
		{#each array as row, i}
			<div>
				{#each row as cell, j}
					<input
						type={typeOf(cell) == "Complex" ? "text" : "number"}
						step="0.01"
						value={round(cell, 2)}
						on:change={(e) => {
							console.log(i, j)
							matrix.set([j, i], Number(e.target.value))
							matrix = matrix
						}}
						{readonly}
					/>
				{/each}
			</div>
		{/each}
	{:else}
		{#each array as cell, i}
			<div>
				<input
					type="number"
					step="0.01"
					value={typeOf(cell) == "Complex" ? cell : round(cell, 2)}
					on:change={(e) => {
						matrix.set([i], Number(e.target.value))
						matrix = matrix
					}}
					{readonly}
				/>
			</div>
		{/each}
	{/if}
</div>

<style>
	.matrix {
		position: relative;
		padding: 0.5em;
	}

	.matrix::before {
		position: absolute;
		box-sizing: border-box;
		left: 0;
		top: 0;
		height: calc(100%);
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
</style>
