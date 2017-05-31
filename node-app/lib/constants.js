/**
 * Mapping of user role
 *
 * @type {{SUPER_ADMIN: number, SOCIETY_ADMIN: number, GENERAL_USER: number, MODERATOR: number, GUEST: number}}
 */
exports.userRoleMapping = {
    SUPER_ADMIN: 0,
    SOCIETY_ADMIN: 1,
    GENERAL_USER: 2,
    MODERATOR: 3,
    GUEST: 4
};

/**
 * User relation ship with flat
 *
 * @type {{OWNER: number, TENANT: number}}
 */
exports.userFlatRelationType = {
    OWNER: 0,
    TENANT: 1
};