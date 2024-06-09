<?php

namespace Exodus4D\Pathfinder\Lib\SystemTag;

use Exodus4D\Pathfinder\Model\Pathfinder\ConnectionModel;
use Exodus4D\Pathfinder\Model\Pathfinder\MapModel;
use Exodus4D\Pathfinder\Model\Pathfinder\SystemModel;
use Exodus4D\Pathfinder\Model\Universe\AbstractUniverseModel;
use Exodus4D\Pathfinder\Lib\Config;
use Exodus4D\Pathfinder\Lib\SystemTag;

class CountConnections implements SystemTagInterface
{
    /**
     * @param SystemModel $targetSystem
     * @param SystemModel $sourceSystem
     * @param MapModel $map
     * @return string|null
     * @throws \Exception
     */
    static function generateFor(SystemModel $targetSystem, SystemModel $sourceSystem, MapModel $map) : ?string
    {
        // set target class for new system being added to the map
        $targetClass = $targetSystem->security;

        //Skip LS and NS
        if ($targetClass == '0.0' || $targetClass == 'L') {
            return '';
        }

        //Skip home hole
        $homeId = Config::getPathfinderData('systemtag')['HOME_SYSTEM_ID'];
        if ($targetSystem->systemId === $homeId) {
            return '';
        }

        // Get all systems from active map
        $systems = $map->getSystemsData();

        // empty array to append tags to,
        // iterate over systems and append tag to $tags if security matches targetSystem security
        // and it is not our home checking by system id
        $tags = array();
        
        foreach ($systems as $system) {
            if ($system->security === $targetClass && $system->systemId !== $homeId && $system->tag) {
                array_push($tags, SystemTag::tagToInt($system->tag));
            }
        };

        // try to assign "s(tatic)" tag to connections from our home by checking by system id,
        // if dest is static, and finally if "Static" (1000) tag is already taken
        if ($sourceSystem->systemId === $homeId){
            if($targetClass == "C3" || $targetClass == "H" ){
                if(!in_array(SystemTag::INT_STATIC, $tags)) {
                    return SystemTag::TAG_STATIC;
                }
            }
        }

        //Skip if HS and not static
        if ($targetClass == 'H') {
            return '';
        }



        // return 'A' if array is empty
        if (count($tags) === 0) {
            return 'A';
        }

        // sort and uniq tags array and iterate to return first empty value
        sort($tags);
        $tags = array_unique($tags);
        $i = 0;
        while($tags[$i] == $i) {
            $i++;
        }

        $char = SystemTag::intToTag($i);
        return $char;
    }
}
