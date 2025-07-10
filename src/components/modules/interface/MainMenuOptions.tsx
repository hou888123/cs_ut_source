import React from 'react';
import Arrow from '../../../assets/arrow.svg';
import { QuestionSuggest } from '../../../services/apiService';

interface MainMenuOptionsProps {
    onOptionClick: (option: string, responseText?: string) => void;
    isLoading: boolean;
    questionSuggestions?: QuestionSuggest[];
}

/**
 * 主選單選項組件
 * 用於顯示對話頁面初始的選項按鈕
 */
const MainMenuOptions: React.FC<MainMenuOptionsProps> = ({
    onOptionClick,
    isLoading,
    questionSuggestions
}) => {
    // 使用 API 返回的問題建議或默認選項
    const options = questionSuggestions && questionSuggestions.length > 0 
        ? questionSuggestions 
        : [];
    
    // 第一個選項通常是使用介紹
    const firstOption = options[0];
    
    return (
        <div className="u-mb-8">
            <button
                className="u-w-full u-border-b u-border-gray-200 u-py-3 u-pr-3 u-flex u-justify-between u-items-center u-cursor-pointer u-bg-transparent u-text-left"
                onClick={() => onOptionClick(firstOption.questionContent, firstOption.questionText)}
                disabled={isLoading}
            >
                <span>{firstOption.questionContent}</span>
                <img src={Arrow} className="u-w-5 u-h-5" />
            </button>

            {options.slice(1).map((option, index) => (
                <button
                    key={`option-${index}`}
                    className="u-w-full u-border-b u-border-gray-200 u-py-3 u-pr-3 u-flex u-justify-between u-items-center u-cursor-pointer u-bg-transparent u-text-left"
                    onClick={() => onOptionClick(option.questionContent, option.questionText)}
                    disabled={isLoading}
                >
                    <span>{option.questionContent}</span>
                    <img src={Arrow} className="u-w-5 u-h-5" />
                </button>
            ))}
        </div>
    );
};

export default MainMenuOptions; 