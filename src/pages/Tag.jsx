import TagItem from "../components/TagItem";
import { useAtom } from "jotai";
import { useMemo, useState, useEffect } from "react";
import {
  eventsAtoms,
  tagIdListAtom,
  tagListAtom,
} from "../atoms/HomeAtoms";
import fetchSchedules from "../api/checkScheduleApi";
import getTagList from "../api/getTagsListApi";
import TagAddModal from "../components/TagAddModal";

import plusBtn from "../assets/tag/plusBtn.svg";

// 모달
import ScheduleModal from "../components/ScheduleModal";
import { tagModalAtom } from "../atoms/TagAtoms";

const groupBy = (list, tagList) => {
  const tagMap = new Map(tagList.map((tag) => [tag.name, tag]));

  // 태그별 그룹 미리 빈 배열로 초기화
  const tagGroups = new Map();
  tagList.forEach((tag) => {
    tagGroups.set(tag.id, {
      tagId: tag.id,
      tag: tag.name,
      color: tag.color,
      task: [],
    });
  });

  const noTagGroup = [];

  list.forEach((task) => {
    if (!task.tagName) {
      noTagGroup.push(task);
      return;
    }

    // 콤마로 구분된 모든 태그 이름 배열
    const tagsInTask = task.tagName
      .split(",")
      .map((t) => t.trim());

    let matched = false;
    tagsInTask.forEach((tagName) => {
      const tag = tagMap.get(tagName);
      if (tag) {
        matched = true;
        tagGroups.get(tag.id).task.push(task);
      }
    });

    if (!matched) {
      noTagGroup.push(task);
    }
  });

  const result = [...tagGroups.values()];
  if (noTagGroup.length > 0) {
    result.push({
      tagId: null,
      tag: "태그 없음",
      color: "#9CA3AF", // 기본 색상
      task: noTagGroup,
    });
  }

  return result;
};

const Tag = () => {
  // 일정 데이터 불러오기(api)
  const [allEvents, setEvents] = useAtom(eventsAtoms);

  // 태그 리스트 불러오기(api)
  const [allTags, setAllTags] = useAtom(tagIdListAtom);

  const [, setTagModalOpen] = useAtom(tagModalAtom);
  const [, setTagList] = useAtom(tagListAtom);

  // 로딩
  const [isLoading, setIsLoading] = useState(true);
  // 무한 로딩 방지용
  const [hasFetched, setHasFetched] = useState(false);

  const groupedList = useMemo(
    () => groupBy(allEvents, allTags),
    [allEvents, allTags]
  );

  // 페이지가 처음 로드 될 때 태그 목록을 가져온다.
  useEffect(() => {
    const fetchTags = async () => {
      try {
        setIsLoading(true); // 로딩 시작
        const tags = await getTagList();
        setAllTags(tags);
        const newTags = tags.map((tag) => ({
          value: tag.name,
          label: tag.name,
        }));
        setTagList(newTags);
      } catch (error) {
        console.error("태그 불러오기 실패:", error);
      } finally {
        setIsLoading(false); // 태그 불러오기 끝
      }
    };
    fetchTags();
  }, [setAllTags, setTagList]);

  // 일정 데이터 불러오기 (한 번만 실행)
  useEffect(() => {
    if (hasFetched) return; // 이미 불러왔으면 실행 안 함

    const loadSchedules = async () => {
      try {
        setIsLoading(true); // 로딩 시작
        const transformedEvents = await fetchSchedules(
          "2025-02-28",
          "2025-12-30"
        );
        setEvents(transformedEvents);
      } catch (error) {
        console.error("Error loading schedules", error);
      } finally {
        setIsLoading(false); // 로딩 끝
        setHasFetched(true); // 무한 루프 방지
      }
    };

    loadSchedules();
  }, [hasFetched, setEvents]);

  return (
    <div className="flex justify-center">
      <TagAddModal />
      <ScheduleModal />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 min-h-[30rem]">
        {isLoading ? (
          <div className="flex justify-center items-center w-[16rem] h-[24rem] bg-[#F0F0F0] shadow-[0px_3.76px_3.76px_0px_rgba(0,0,0,0.25)] border-[0.47px] border-stone-500 rounded-2xl p-8">
            로딩중...
          </div>
        ) : (
          groupedList.map((group) => (
            <TagItem
              key={group.tagId ?? "no-tag"}
              eventsList={group}
            />
          ))
        )}
        {!isLoading && (
          <div className="flex justify-center items-center">
            <div
              className="flex justify-center items-center w-[16rem] h-[24rem] bg-[#F0F0F0] shadow-[0px_3.76px_3.76px_0px_rgba(0,0,0,0.25)] border-[0.47px] border-stone-500 rounded-2xl p-8 hover:cursor-pointer hover:bg-gray-200"
              onClick={() => {
                setTagModalOpen(true);
              }}
            >
              <img
                src={plusBtn}
                className="w-12 h-12"
                width={48}
                height={48}
                alt="태그 추가"
                fetchPriority="high"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tag;
