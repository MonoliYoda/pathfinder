<?php

namespace Exodus4D\Pathfinder\Lib;

use Exodus4D\Pathfinder\Lib\Config;
use Exodus4D\Pathfinder\Lib\SystemTag\SystemTagInterface;
use Exodus4D\Pathfinder\Model\Pathfinder\MapModel;
use Exodus4D\Pathfinder\Model\Pathfinder\SystemModel;

class SystemTag {
    const TAG_STATIC = 'Static';

    const INT_STATIC = 1000;
    const INT_CUSTOM = 1001; 


    /**
     * @param SystemModel $targetSystem
     * @param SystemModel $sourceSystem
     * @param MapModel $map
     * @return string|null
     */
    static function generateFor(SystemModel $targetSystem, SystemModel $sourceSystem, MapModel $map) : ?string
    {
        $config = Config::getPathfinderData('systemtag');

        if(!isset($config['STATUS']) || $config['STATUS'] !== 1) {
            return null;
        }

        $style = isset($config['STYLE']) ? $config['STYLE'] : 'countConnections';
        $className = '\\Exodus4D\\Pathfinder\\Lib\\SystemTag\\' . ucfirst($style);

        if(!class_exists($className) || !is_subclass_of($className, SystemTagInterface::class)) {
            return null;
        }

        return $className::generateFor($targetSystem, $sourceSystem, $map);
    }

    static function nextBookmarks(MapModel $map) : ?string
    {
        $systems = $map->getSystemsData();
        $systemClasses = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];
        $tags = array();

        foreach($systemClasses as $systemClass){
            $tagsInUse = array();
            $config = Config::getPathfinderData('systemtag');
            foreach($systems as $system){
                if($system->security == $systemClass && $system->systemId !== $config['HOME_SYSTEM_ID'] && gettype($system->tag) == "string"){
                    array_push($tagsInUse, SystemTag::tagToInt($system->tag));
                }
            }
            sort($tagsInUse);

            $availableTags = array();
            $i = 0;
            while(count($availableTags) < 5) {
                if(!in_array($i, $tagsInUse)) {
                    array_push($availableTags, SystemTag::intToTag($i));
                }
                $i++;
            }
            array_push($tags, $availableTags);
        }
        return json_encode($tags);
    }

    /**
     * converts integer to character tag
     * @param int $int
     * @return string
     */
    static function intToTag(int $int): string {
        if ($int === self::INT_STATIC) {
            return self::TAG_STATIC;
        }

        // tags above 701 are out of bounds of A-ZZ tagging range
        // this might've been a custom tag, but it
        // should not have gotten to this part of code;
        // negative tags are not supported;
        // this also covers the INT_CUSTOM value
        if ($int > 701 || $int < 0) {
            return '?';
        }

        if($int > 25){
            // above 25 are double-char tags AA-ZZ
            $chrCode1 = chr(65 + floor($int / 26) -1);
            $chrCode2 = chr(65 + $int - (floor($int/26) * 26));
            $tag = "$chrCode1$chrCode2";
        } else {
            // regular A-Z tags
            $tag = chr(65 + $int);
        }

        return $tag;
    }

    /**
     * converts string tag to integer normalized to A=0;
     * whatever cannot be converted or does not match the A-ZZ bounds, is considered a custom tag
     * @param string $tag
     * @return int
     */
    static function tagToInt(string $tag): int {
        if ($tag === self::TAG_STATIC) {
            return self::INT_STATIC;
        }

        // normalize string to upper
        $uctag = strtoupper($tag);
        if (strlen($uctag) === 1){
            $int = ord($uctag) - 65;

            // character is out of bounds, consider it custom
            if ($int < 0 || $int > 25){
                return self::INT_CUSTOM;
            }

            return $int;
        } 
        
        if (strlen($uctag) === 2) {
            $chars = str_split($uctag);
            $first = ord($chars[0]) - 65;
            $second = ord($chars[1]) - 65;

            // either of characters is out of bounds, consider it custom
            if ($first < 0 || $first > 25 || $second < 0 || $second > 25){
                return self::INT_CUSTOM;
            }

            return ($first + 1)*26 + $second;
        } 
        
        
        // too long or empty, consider it custom
        return self::INT_CUSTOM;
    }
}
