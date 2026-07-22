
export function validateScopes(scopes: string[]) {
	for (const scope of scopes) {
		if (scope === "") throw new Error(`invalid scope empty string`)
		forbidden(scope, ".")
		forbidden(scope, ":")
	}
	return scopes
}

function forbidden(scope: string, illegal: string) {
	if (scope.includes(illegal))
		throw new Error(`invalid scope "${scope}" contains illegal "${illegal}"`)
}

