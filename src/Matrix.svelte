<script>
	import { round } from "./linalg.js"
	export let matrix
	export let readonly = false
</script>

<div class="matrix">
	{#if Array.isArray(matrix[0])}
		{#each matrix as row, i}
			<div>
				{#each row as cell, j}
					<input
						type="number"
						step="0.01"
						value={round(cell)}
						on:change={(e) => (matrix[i][j] = Number(e.target.value))}
						{readonly}
					/>
				{/each}
			</div>
		{/each}
	{:else}
		{#each matrix as cell, i}
			<div>
				<input
					type="number"
					step="0.01"
					value={round(cell)}
					on:change={(e) => (matrix[i] = Number(e.target.value))}
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
