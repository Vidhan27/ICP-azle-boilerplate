
import { $query, $update, Record, StableBTreeMap, Vec, Result, nat64, ic, Opt } from 'azle';

import { v4 as uuidv4 } from 'uuid';

// Define types for SkillRecord and SkillPayload
type SkillRecord = Record<{
    id: string;

    name: string;
    proficiency: string;
    createdAt: nat64;
}>

type SkillPayload = Record<{
    name: string;
    proficiency: string;

}>

// Create a map to store skill records
const skillStorage = new StableBTreeMap<string, SkillRecord>(0, 44, 1024);

$update;
export function addSkill(payload: SkillPayload): Result<SkillRecord, string> {

    const record: SkillRecord = { 
        id: uuidv4(), 
        createdAt: ic.time(), 
        ...payload 
    };

    skillStorage.insert(record.id, record);
    return Result.Ok(record);
}


// Function to get all skills
$query;
export function getAllSkills(): Result<Vec<SkillRecord>, string> {
    return Result.Ok(skillStorage.values());
}

// Function to get a specific skill by id
$query;
export function getSkill(id: string): Result<SkillRecord, string> {
    const skillOpt = skillStorage.get(id);
    
    // Check if skillOpt is Some and not undefined
    if ("Some" in skillOpt && skillOpt.Some !== undefined) {
        const skill = skillOpt.Some as SkillRecord; // Type assertion
        return Result.Ok(skill);
    } else {
        return Result.Err(`Skill with id=${id} not found`);
    }
}

// Function to update a skill by id
$update;
export function updateSkill(id: string, payload: SkillPayload): Result<SkillRecord, string> {
    const existingSkillOpt = skillStorage.get(id);
    
    if ("Some" in existingSkillOpt && existingSkillOpt.Some !== undefined) {
        const existingSkill = existingSkillOpt.Some as SkillRecord;
        const updatedSkill: SkillRecord = {
            ...existingSkill,
            ...payload
        };
        skillStorage.insert(id, updatedSkill);
        return Result.Ok(updatedSkill);
    } else {
        return Result.Err(`Skill with id=${id} not found`);
    }
}

// Function to delete a skill by id
$update;
export function deleteSkill(id: string): Result<void, string> {
    const result = skillStorage.remove(id);
    if (result) {
        return Result.Ok(undefined);
    } else {
        return Result.Err(`Skill with id=${id} not found`);
    }
}

// A workaround to make the uuid package work with Azle
globalThis.crypto = {
    // @ts-ignore
    getRandomValues: () => {
        let array = new Uint8Array(32);

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }

        return array;
    },

};

