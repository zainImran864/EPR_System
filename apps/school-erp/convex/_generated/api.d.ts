/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as account from "../account.js";
import type * as attendance from "../attendance.js";
import type * as auth from "../auth.js";
import type * as classes from "../classes.js";
import type * as dashboard from "../dashboard.js";
import type * as email from "../email.js";
import type * as lib_hash from "../lib/hash.js";
import type * as lib_identity from "../lib/identity.js";
import type * as marks from "../marks.js";
import type * as notifications from "../notifications.js";
import type * as registrations from "../registrations.js";
import type * as results from "../results.js";
import type * as schools from "../schools.js";
import type * as seed from "../seed.js";
import type * as students from "../students.js";
import type * as superadmin from "../superadmin.js";
import type * as teachers from "../teachers.js";
import type * as timetable from "../timetable.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  account: typeof account;
  attendance: typeof attendance;
  auth: typeof auth;
  classes: typeof classes;
  dashboard: typeof dashboard;
  email: typeof email;
  "lib/hash": typeof lib_hash;
  "lib/identity": typeof lib_identity;
  marks: typeof marks;
  notifications: typeof notifications;
  registrations: typeof registrations;
  results: typeof results;
  schools: typeof schools;
  seed: typeof seed;
  students: typeof students;
  superadmin: typeof superadmin;
  teachers: typeof teachers;
  timetable: typeof timetable;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
